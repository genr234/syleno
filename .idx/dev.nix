# https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  channel = "stable-24.05";
  # https://search.nixos.org/packages 
  packages = [
    pkgs.bun
    pkgs.busybox
    pkgs.gnumake
    pkgs.neovim
    pkgs.git
  ];
  # Sets environment variables in the workspace
  env = {};
  idx = {
    extensions = [
      "Catppuccin.catppuccin-vsc-icons"
      "devgauravjatt.github-catppuccin-dark"
      "esbenp.prettier-vscode"
    ];
    previews = {
      enable = false;
      previews = {
        web = {
          command = ["make" "dev"];
          manager = "web";
          env = {
            PORT = "8081";
          };
        };
      };
    };
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        bun-install = "bun install";
        default.openFiles = [ ".idx/dev.nix" ];
      };
      # Runs when the workspace is (re)started
      onStart = {
        
      };
    };
  };
}