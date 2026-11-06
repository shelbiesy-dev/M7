// Entry point. Checks that the sea can be drawn before loading the 3D code,
// so a missing WebGL (E9) or a failed Three.js download (E8) shows a calm
// message instead of a broken page (docs/05_error_states.md).

const MESSAGE_NO_WEBGL =
  "This browser can't show the sea. Try the latest Chrome, Firefox or Safari.";
const MESSAGE_NO_THREE =
  'The sea could not load. Check the internet connection and reload.';

function showFatal(message) {
  const box = document.getElementById('fatal');
  box.querySelector('p').textContent = message;
  box.hidden = false;
  for (const id of ['hint', 'status', 'mute']) {
    document.getElementById(id).hidden = true;
  }
}

function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

if (!hasWebGL2()) {
  showFatal(MESSAGE_NO_WEBGL);
} else {
  import('./app.js')
    .then(({ start }) => {
      try {
        start();
      } catch (error) {
        console.error(error);
        showFatal(MESSAGE_NO_WEBGL);
      }
    })
    .catch((error) => {
      console.error(error);
      showFatal(MESSAGE_NO_THREE);
    });
}
