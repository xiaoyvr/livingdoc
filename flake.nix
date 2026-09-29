{
  description = "livingdoc — documentation that cannot be published while it is false";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.ticket = {
    url = "github:wedow/ticket/v0.3.2";
    flake = false;
  };

  outputs =
    {
      nixpkgs,
      ticket,
      ...
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          ticket-text = ''
            export PATH="${
              pkgs.lib.makeBinPath (
                with pkgs;
                [
                  coreutils
                  findutils
                  gawk
                  git
                  gnugrep
                  gnused
                  jq
                  ripgrep
                ]
              )
            }:$PATH"
            ${builtins.readFile (ticket + "/ticket")}
          '';
          ticket-cli = pkgs.symlinkJoin {
            name = "ticket-cli";
            paths = [
              (pkgs.writeShellScriptBin "tk" ticket-text)
              (pkgs.writeShellScriptBin "ticket" ticket-text)
            ];
          };
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.nixfmt
              (pkgs.python3.withPackages (ps: [ ps.pytest ]))
              ticket-cli
            ];

            shellHook = ''
              if [ ! -d node_modules/.bin ]; then
                echo "livingdoc: dependencies not installed, run 'npm install'" >&2
              fi
            '';
          };
        }
      );
    };
}
