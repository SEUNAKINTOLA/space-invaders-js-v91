// tests/unit/ui/AudioControls.test.js

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { AudioManager } from '../../../src/ui/AudioManager';
import { AudioError } from '../../../src/errors/AudioError';

/**
 * Mock implementation of the Web Audio API
 */
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1 }
  })),
  createOscillator: jest.fn(),
  state: 'running',
  resume: jest.fn(),
  suspend: jest.fn()
};

/**
 * Mock implementation of HTMLAudioElement
 */
class MockAudio {
  constructor() {
    this.play = jest.fn().mockResolvedValue(undefined);
    this.pause = jest.fn();
    this.load = jest.fn();
    this.volume = 1;
    this.currentTime = 0;
    this.duration = 100;
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
  }
}

describe('AudioManager', () => {
  let audioManager;
  let originalAudio;
  let originalAudioContext;

  beforeEach(() => {
    // Store original globals
    originalAudio = global.Audio;
    originalAudioContext = global.AudioContext;

    // Setup mocks
    global.Audio = MockAudio;
    global.AudioContext = jest.fn(() => mockAudioContext);

    // Initialize AudioManager
    audioManager = new AudioManager();
  });

  afterEach(() => {
    // Restore original globals
    global.Audio = originalAudio;
    global.AudioContext = originalAudioContext;

    // Clean up
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create an AudioManager instance successfully', () => {
      expect(audioManager).toBeInstanceOf(AudioManager);
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('should handle AudioContext initialization failure', () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported');
      });

      expect(() => new AudioManager()).toThrow(AudioError);
    });
  });

  describe('volume control', () => {
    it('should set master volume correctly', () => {
      const volume = 0.5;
      audioManager.setMasterVolume(volume);
      expect(audioManager.getMasterVolume()).toBe(volume);
    });

    it('should clamp volume values between 0 and 1', () => {
      audioManager.setMasterVolume(1.5);
      expect(audioManager.getMasterVolume()).toBe(1);

      audioManager.setMasterVolume(-0.5);
      expect(audioManager.getMasterVolume()).toBe(0);
    });
  });

  describe('sound effects', () => {
    const testSoundEffect = 'explosion.mp3';

    it('should load sound effect successfully', async () => {
      await expect(audioManager.loadSound(testSoundEffect)).resolves.not.toThrow();
    });

    it('should play sound effect', async () => {
      await audioManager.loadSound(testSoundEffect);
      await expect(audioManager.playSound(testSoundEffect)).resolves.not.toThrow();
    });

    it('should handle non-existent sound effect', async () => {
      await expect(audioManager.playSound('nonexistent.mp3'))
        .rejects.toThrow(AudioError);
    });

    it('should stop sound effect', async () => {
      await audioManager.loadSound(testSoundEffect);
      await audioManager.playSound(testSoundEffect);
      expect(() => audioManager.stopSound(testSoundEffect)).not.toThrow();
    });
  });

  describe('background music', () => {
    const testMusic = 'background.mp3';

    it('should handle background music transitions', async () => {
      await audioManager.loadMusic(testMusic);
      await expect(audioManager.playMusic(testMusic, { fadeIn: true }))
        .resolves.not.toThrow();
    });

    it('should pause and resume background music', async () => {
      await audioManager.loadMusic(testMusic);
      await audioManager.playMusic(testMusic);
      
      expect(() => audioManager.pauseMusic()).not.toThrow();
      expect(() => audioManager.resumeMusic()).not.toThrow();
    });

    it('should handle multiple music tracks', async () => {
      const track1 = 'track1.mp3';
      const track2 = 'track2.mp3';

      await audioManager.loadMusic(track1);
      await audioManager.loadMusic(track2);

      await audioManager.playMusic(track1);
      await expect(audioManager.crossfade(track2)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle audio loading errors', async () => {
      const mockAudio = new MockAudio();
      mockAudio.load = jest.fn(() => {
        throw new Error('Network error');
      });
      global.Audio = jest.fn(() => mockAudio);

      await expect(audioManager.loadSound('error.mp3'))
        .rejects.toThrow(AudioError);
    });

    it('should handle audio playback errors', async () => {
      const mockAudio = new MockAudio();
      mockAudio.play = jest.fn().mockRejectedValue(new Error('Playback failed'));
      global.Audio = jest.fn(() => mockAudio);

      await audioManager.loadSound('test.mp3');
      await expect(audioManager.playSound('test.mp3'))
        .rejects.toThrow(AudioError);
    });
  });

  describe('resource management', () => {
    it('should clean up resources when destroyed', () => {
      audioManager.destroy();
      expect(mockAudioContext.suspend).toHaveBeenCalled();
    });

    it('should handle memory management', async () => {
      const track = 'memory.mp3';
      await audioManager.loadSound(track);
      audioManager.unloadSound(track);
      
      await expect(audioManager.playSound(track))
        .rejects.toThrow(AudioError);
    });
  });
});