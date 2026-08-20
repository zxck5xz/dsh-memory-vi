import { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "dsh-memory-vi";
export declare const inject: string[];
export declare const Config: z<Schemastery.ObjectS<{
    root: z<string, string>;
}>, Schemastery.ObjectT<{
    root: z<string, string>;
}>>;
export declare function apply(ctx: Context, config: Schemastery.TypeT<typeof Config>): void;
