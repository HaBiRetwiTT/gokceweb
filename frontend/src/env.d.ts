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

// Vue single-file components module declaration
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Avoid empty object type and any; use safer defaults
  type EmptyProps = Record<string, never>
  type EmptySetup = Record<string, never>
  const component: DefineComponent<EmptyProps, EmptySetup, unknown>
  export default component
}
