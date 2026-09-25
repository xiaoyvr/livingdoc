{
  description = "livingdoc — documentation that cannot be published while it is false";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
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
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.nixfmt
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
