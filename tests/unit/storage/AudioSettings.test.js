/**
 * @fileoverview Unit tests for AudioSettings storage functionality
 * @jest
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import LocalStorage from '../../../src/storage/LocalStorage';
import AudioSettings from '../../../src/storage/AudioSettings';

// Mock localStorage to avoid browser dependency
jest.mock('../../../src/storage/LocalStorage');

describe('AudioSettings', () => {
    // Default test values
    const DEFAULT_VOLUME = 0.75;
    const DEFAULT_MUSIC_ENABLED = true;
    const DEFAULT_SFX_ENABLED = true;

    let audioSettings;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        LocalStorage.getItem.mockClear();
        LocalStorage.setItem.mockClear();

        // Initialize fresh AudioSettings instance
        audioSettings = new AudioSettings();
    });

    describe('initialization', () => {
        it('should initialize with default values when no stored settings exist', () => {
            LocalStorage.getItem.mockReturnValue(null);

            const settings = new AudioSettings();

            expect(settings.getVolume()).toBe(DEFAULT_VOLUME);
            expect(settings.isMusicEnabled()).toBe(DEFAULT_MUSIC_ENABLED);
            expect(settings.isSfxEnabled()).toBe(DEFAULT_SFX_ENABLED);
        });

        it('should load existing settings from storage', () => {
            const storedSettings = {
                volume: 0.5,
                musicEnabled: false,
                sfxEnabled: true
            };
            LocalStorage.getItem.mockReturnValue(JSON.stringify(storedSettings));

            const settings = new AudioSettings();

            expect(settings.getVolume()).toBe(0.5);
            expect(settings.isMusicEnabled()).toBe(false);
            expect(settings.isSfxEnabled()).toBe(true);
        });

        it('should handle corrupted storage data gracefully', () => {
            LocalStorage.getItem.mockReturnValue('invalid-json');

            const settings = new AudioSettings();

            expect(settings.getVolume()).toBe(DEFAULT_VOLUME);
            expect(settings.isMusicEnabled()).toBe(DEFAULT_MUSIC_ENABLED);
            expect(settings.isSfxEnabled()).toBe(DEFAULT_SFX_ENABLED);
        });
    });

    describe('volume management', () => {
        it('should set and persist volume changes', () => {
            const newVolume = 0.3;
            audioSettings.setVolume(newVolume);

            expect(audioSettings.getVolume()).toBe(newVolume);
            expect(LocalStorage.setItem).toHaveBeenCalledWith(
                'audioSettings',
                expect.stringContaining('"volume":0.3')
            );
        });

        it('should clamp volume values between 0 and 1', () => {
            audioSettings.setVolume(1.5);
            expect(audioSettings.getVolume()).toBe(1.0);

            audioSettings.setVolume(-0.5);
            expect(audioSettings.getVolume()).toBe(0.0);
        });

        it('should throw error for non-numeric volume values', () => {
            expect(() => audioSettings.setVolume('invalid'))
                .toThrow('Volume must be a number between 0 and 1');
        });
    });

    describe('music settings', () => {
        it('should toggle and persist music enabled state', () => {
            audioSettings.setMusicEnabled(false);

            expect(audioSettings.isMusicEnabled()).toBe(false);
            expect(LocalStorage.setItem).toHaveBeenCalledWith(
                'audioSettings',
                expect.stringContaining('"musicEnabled":false')
            );
        });

        it('should throw error for non-boolean music enabled value', () => {
            expect(() => audioSettings.setMusicEnabled('invalid'))
                .toThrow('Music enabled state must be a boolean');
        });
    });

    describe('sound effects settings', () => {
        it('should toggle and persist SFX enabled state', () => {
            audioSettings.setSfxEnabled(false);

            expect(audioSettings.isSfxEnabled()).toBe(false);
            expect(LocalStorage.setItem).toHaveBeenCalledWith(
                'audioSettings',
                expect.stringContaining('"sfxEnabled":false')
            );
        });

        it('should throw error for non-boolean SFX enabled value', () => {
            expect(() => audioSettings.setSfxEnabled('invalid'))
                .toThrow('SFX enabled state must be a boolean');
        });
    });

    describe('storage operations', () => {
        it('should handle storage errors gracefully', () => {
            LocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });

            expect(() => audioSettings.setVolume(0.5))
                .not.toThrow();
            // Should still update in-memory value even if storage fails
            expect(audioSettings.getVolume()).toBe(0.5);
        });

        it('should save all settings together', () => {
            audioSettings.setVolume(0.4);
            audioSettings.setMusicEnabled(false);
            audioSettings.setSfxEnabled(true);

            const expectedSettings = {
                volume: 0.4,
                musicEnabled: false,
                sfxEnabled: true
            };

            expect(LocalStorage.setItem).toHaveBeenLastCalledWith(
                'audioSettings',
                JSON.stringify(expectedSettings)
            );
        });
    });

    describe('reset functionality', () => {
        it('should reset all settings to defaults', () => {
            audioSettings.setVolume(0.1);
            audioSettings.setMusicEnabled(false);
            audioSettings.setSfxEnabled(false);

            audioSettings.resetToDefaults();

            expect(audioSettings.getVolume()).toBe(DEFAULT_VOLUME);
            expect(audioSettings.isMusicEnabled()).toBe(DEFAULT_MUSIC_ENABLED);
            expect(audioSettings.isSfxEnabled()).toBe(DEFAULT_SFX_ENABLED);
        });

        it('should persist default settings after reset', () => {
            audioSettings.resetToDefaults();

            expect(LocalStorage.setItem).toHaveBeenCalledWith(
                'audioSettings',
                JSON.stringify({
                    volume: DEFAULT_VOLUME,
                    musicEnabled: DEFAULT_MUSIC_ENABLED,
                    sfxEnabled: DEFAULT_SFX_ENABLED
                })
            );
        });
    });
});