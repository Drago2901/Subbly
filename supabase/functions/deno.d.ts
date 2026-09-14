declare module "npm:@supabase/server" {
  export * from "@supabase/server";
}

declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
    export function set(key: string, value: string): void;
  }
}
