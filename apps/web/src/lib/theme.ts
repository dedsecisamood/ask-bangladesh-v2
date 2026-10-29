// Trusted static source only; no request input, credentials or citizen data.
// Apply the optional local preference before paint; CSS supplies system fallback.
export const themeInitialization = `(function(){try{var t=localStorage.getItem('askbd-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})()`;
