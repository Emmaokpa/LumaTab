
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { appwriteService, User } from '@/lib/appwrite';
import { v1 } from '@google-cloud/aiplatform';

// Initialize the Google AI Platform client
const { PredictionServiceClient } = v1;
const clientOptions = {
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};
const predictionServiceClient = new PredictionServiceClient(clientOptions);

// Your Google Cloud project details
const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
if (!project) {
  throw new Error('GOOGLE_CLOUD_PROJECT_ID is not set in environment variables.');
}
const endpointId = 'imagegeneration@005';
const location = 'us-central1';

const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${endpointId}`;

async function generateImageWithAi(prompt: string): Promise<string> {
    const instance = { prompt };
    const parameters = {
        sampleCount: 1,
        aspectRatio: "9:16",
        negativePrompt: "blurry, low-resolution, ugly, deformed, text, watermark"
    };

    // Convert the plain JavaScript objects into the structured format the API expects.
    const instances = [predictionServiceClient.toValue(instance)];
    const parameter_obj = predictionServiceClient.toValue(parameters);

    const request = {
        endpoint,
        instances,
        parameters: parameter_obj,
    };

    const [response] = await predictionServiceClient.predict(request);
    
    if (!response.predictions || response.predictions.length === 0) {
        throw new Error('AI failed to generate a prediction.');
    }

    const prediction = response.predictions[0];

    // Convert the response back from the API's format into a plain JavaScript object.
    const predictionValue = predictionServiceClient.fromValue(prediction);

    const imageBase64 = (predictionValue as any).bytesBase64Encoded;

    if (!imageBase64) {
        throw new Error('AI response did not contain valid image data.');
    }

    return imageBase64;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  try {
    const user = await appwriteService.getUser(session.user.id) as unknown as User;
    if (user.subscriptionStatus !== 'active') {
        return res.status(403).send({ message: 'AI generation is a Pro feature. Please subscribe to continue.' });
    }
  } catch (error: any) {
    console.error('Error verifying user subscription:', error);
    if (error.code === 404) {
        return res.status(404).send({ message: 'User not found.' });
    }
    return res.status(500).send({ message: 'An error occurred while verifying your subscription.' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).send({ message: 'A valid prompt is required.' });
  }

  try {
    const imageBase64 = await generateImageWithAi(prompt);
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    res.status(200).send({ imageUrl });
  } catch (error) {
    console.error('Error generating AI image:', error);
    res.status(500).send({ message: 'Failed to generate AI image.' });
  }
}
