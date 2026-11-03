{
  buildNpmPackage,
  makeWrapper,
  nodejs_26,
}:
let
  appletId = "lt.nyv.glimpse-stopwatch";
in
buildNpmPackage {
  src = ../.;

  pname = "glimpse-stopwatch";
  version = "0.1.0";

  npmDepsHash = "sha256-iz7csoJbqQ6YSBe958o6gGA0wIyA+2QXNuKDGziAOFc=";

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
    description = "Stopwatch applet for the Glimpse desktop panel";
    mainProgram = appletId;
    platforms = [
      "x86_64-linux"
      "aarch64-linux"
    ];
  };
}
