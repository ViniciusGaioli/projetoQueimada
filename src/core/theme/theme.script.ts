import { themeAttribute, themeStorageKey } from './theme.constants'

/**
 * Script síncrono que aplica o tema salvo antes da primeira pintura, evitando
 * o flash entre o tema renderizado no servidor e a preferência do usuário.
 *
 * Deve ser injetado no `<head>` via `dangerouslySetInnerHTML`.
 *
 * @example
 * <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
 */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    themeStorageKey,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute(${JSON.stringify(
    themeAttribute,
)},t)}catch(e){}})()`
