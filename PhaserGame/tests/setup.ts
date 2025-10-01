import { vi } from 'vitest';

// Mock HTMLCanvasElement's getContext to prevent Phaser canvas errors in tests
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
    if (contextId === '2d' || contextId === 'webgl' || contextId === 'webgl2') {
        return {
            canvas: this,
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            fillRect: () => {},
            clearRect: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray() }),
            putImageData: () => {},
            createImageData: () => ({ data: new Uint8ClampedArray() }),
            setTransform: () => {},
            drawImage: () => {},
            save: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            arc: () => {},
            fill: () => {},
            measureText: () => ({ width: 0 }),
            transform: () => {},
            rect: () => {},
            clip: () => {},
        } as any;
    }
    return null;
};

// Mock Phaser module
// NOTE: Math.random() is used here for test mocking purposes only, not for cryptographic operations.
// This mock simulates Phaser's random utilities for testing game logic (card shuffling, random selection).
// SonarQube S2245: Safe to use Math.random() in test mocks for non-security-sensitive operations.
vi.mock('phaser', () => ({
    default: {
        Math: {
            Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min // NOSONAR
        },
        Utils: {
            Array: {
                Shuffle: <T,>(array: T[]) => {
                    const result = [...array];
                    for (let i = result.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1)); // NOSONAR
                        [result[i], result[j]] = [result[j], result[i]];
                    }
                    return result;
                },
                GetRandom: <T,>(array: T[]) => {
                    return array[Math.floor(Math.random() * array.length)]; // NOSONAR
                }
            }
        },
        Geom: {
            Rectangle: class Rectangle {
                constructor(public x: number, public y: number, public width: number, public height: number) {}
                static Contains(rect: any, x: number, y: number) {
                    return x >= rect.x && x <= rect.x + rect.width &&
                           y >= rect.y && y <= rect.y + rect.height;
                }
            }
        },
        Scene: class {}
    }
}));

