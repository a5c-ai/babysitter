/**
 * Hook that smoothly animates a number from its previous value to the target.
 * Uses requestAnimationFrame for smooth 60fps transitions.
 *
 * @param target - The number to animate towards
 * @param duration - Animation duration in ms (default 600)
 * @returns The current animated value (integer)
 */
export declare function useAnimatedNumber(target: number, duration?: number): number;
