declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

// Global window object extensions
declare global {
  interface Window {
    kartliIslemAutoOpenModal?: boolean;
  }
  
  // Ensure console is properly typed
  var console: Console;
}
