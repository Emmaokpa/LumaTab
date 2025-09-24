{ pkgs, ... }: {
  # To learn more about how to configure your Nix environment, visit
  # https://developers.google.com/idx/guides/customize-idx-env
  channel = "stable-23.11"; # Or "unstable"
  
  packages = [
    pkgs.nodejs_20
    pkgs.pkg-config
    pkgs.gcc
    pkgs.libressl_3_6.bin
  ];

  env = {};
}
