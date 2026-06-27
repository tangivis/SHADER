/* tslint:disable */
/* eslint-disable */

export class Playground {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    assembled_source(generated_wgsl: string): string;
    static create(canvas: HTMLCanvasElement): Promise<Playground>;
    /**
     * Per-shader custom knobs (e0..e3), referenced as u.extra.x/y/z/w in WGSL.
     */
    set_extra(e0: number, e1: number, e2: number, e3: number): void;
    set_mouse(x: number, y: number, down: boolean): void;
    /**
     * Live knobs: speed (x time), scale (x freq), hue shift, brightness.
     */
    set_params(speed: number, scale: number, hue: number, bright: number): void;
    set_shader(generated_wgsl: string): void;
}

export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_playground_free: (a: number, b: number) => void;
    readonly playground_assembled_source: (a: number, b: number, c: number) => [number, number];
    readonly playground_create: (a: any) => any;
    readonly playground_set_extra: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly playground_set_mouse: (a: number, b: number, c: number, d: number) => void;
    readonly playground_set_params: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly playground_set_shader: (a: number, b: number, c: number) => [number, number];
    readonly start: () => void;
    readonly wasm_bindgen__convert__closures_____invoke__hb65a1df44258e1d3: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen__convert__closures_____invoke__h8fa40c188644c1a3: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h661ea52b389f141b: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h661ea52b389f141b_2: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__hb72ad9652da3347b: (a: number, b: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
