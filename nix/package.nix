{
  buildNpmPackage,
  makeWrapper,
  nodejs_26,
}:
let
  appletId = "lt.nyv.glimpse-track";
in
buildNpmPackage {
  src = ../.;

  pname = "glimpse-track";
  version = "0.1.0";

  npmDepsHash = "sha256-KBqEOq9WA/C+Ze1ZzqCciNcc52SoA6NNlwzAIUWSVRU=";

  nativeBuildInputs = [ makeWrapper ];

  # The build script bundles everything into dist/applet.mjs with esbuild,
  # so only the bundle (plus a launcher and the desktop entry) gets installed;
  # no node_modules are needed at runtime.
  installPhase = ''
    runHook preInstall

    install -Dm0644 dist/applet.mjs $out/share/glimpse/${appletId}/applet.mjs
    makeWrapper ${nodejs_26}/bin/node $out/bin/${appletId} \
      --add-flags "$out/share/glimpse/${appletId}/applet.mjs"

    install -Dm0644 ${appletId}.desktop $out/share/applications/${appletId}.desktop
    substituteInPlace $out/share/applications/${appletId}.desktop \
      --replace-fail "Exec=node applet.mjs" "Exec=$out/bin/${appletId}"

    runHook postInstall
  '';

  passthru.appletId = appletId;

  meta = {
    description = "Track applet for the Glimpse desktop panel";
    mainProgram = appletId;
    platforms = [
      "x86_64-linux"
      "aarch64-linux"
    ];
  };
}
