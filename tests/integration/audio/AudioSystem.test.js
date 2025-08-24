/**
 * @fileoverview Integration tests for the Audio System
 * @description Tests the complete audio management system including sound effects and background music
 */

import { jest } from '@jest/globals';
import { AudioManager } from '../../../src/audio/AudioManager';
import { AudioError } from '../../../src/audio/AudioError';
import { SoundEffect } from '../../../src/audio/SoundEffect';
import { BackgroundMusic } from '../../../src/audio/BackgroundMusic';

// Mock Web Audio API
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 },
  })),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
  })),
  decodeAudioData: jest.fn(),
};

describe('Audio System Integration Tests', () => {
  let audioManager;
  
  beforeAll(() => {
    // Mock window.AudioContext
    global.AudioContext = jest.fn(() => mockAudioContext);
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Sound Effects Management', () => {
    it('should load and play sound effects correctly', async () => {
      // Arrange
      const soundEffect = new SoundEffect('explosion', '/assets/sounds/explosion.mp3');
      const audioBuffer = new ArrayBuffer(8);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });
      mockAudioContext.decodeAudioData.mockResolvedValueOnce(audioBuffer);

      // Act
      await audioManager.loadSoundEffect(soundEffect);
      await audioManager.playSoundEffect('explosion');

      // Assert
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should handle multiple concurrent sound effects', async () => {
      // Arrange
      const effects = [
        new SoundEffect('effect1', '/assets/sounds/effect1.mp3'),
        new SoundEffect('effect2', '/assets/sounds/effect2.mp3'),
      ];
      const audioBuffer = new ArrayBuffer(8);
      
      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });
      mockAudioContext.decodeAudioData.mockResolvedValue(audioBuffer);

      // Act
      await Promise.all(effects.map(effect => audioManager.loadSoundEffect(effect)));
      await Promise.all(effects.map(effect => audioManager.playSoundEffect(effect.id)));

      // Assert
      expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(2);
    });

    it('should throw AudioError when loading invalid sound effect', async () => {
      // Arrange
      const invalidEffect = new SoundEffect('invalid', '/invalid/path.mp3');
      global.fetch.mockRejectedValueOnce(new Error('404 Not Found'));

      // Act & Assert
      await expect(audioManager.loadSoundEffect(invalidEffect))
        .rejects
        .toThrow(AudioError);
    });
  });

  describe('Background Music Management', () => {
    it('should handle background music transitions smoothly', async () => {
      // Arrange
      const music1 = new BackgroundMusic('music1', '/assets/music/track1.mp3');
      const music2 = new BackgroundMusic('music2', '/assets/music/track2.mp3');
      const audioBuffer = new ArrayBuffer(8);

      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });
      mockAudioContext.decodeAudioData.mockResolvedValue(audioBuffer);

      // Act
      await audioManager.loadBackgroundMusic(music1);
      await audioManager.loadBackgroundMusic(music2);
      await audioManager.playBackgroundMusic('music1');
      await audioManager.crossfadeToMusic('music2', 2000);

      // Assert
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4); // 2 for each track
    });

    it('should maintain correct volume levels', async () => {
      // Arrange
      const music = new BackgroundMusic('music', '/assets/music/track.mp3');
      const audioBuffer = new ArrayBuffer(8);
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });
      mockAudioContext.decodeAudioData.mockResolvedValueOnce(audioBuffer);

      // Act
      await audioManager.loadBackgroundMusic(music);
      await audioManager.playBackgroundMusic('music');
      audioManager.setMasterVolume(0.5);
      audioManager.setMusicVolume(0.8);

      // Assert
      expect(audioManager.getMasterVolume()).toBe(0.5);
      expect(audioManager.getMusicVolume()).toBe(0.8);
    });
  });

  describe('Error Handling and Resource Management', () => {
    it('should cleanup resources properly on disposal', async () => {
      // Arrange
      const effect = new SoundEffect('effect', '/assets/sounds/effect.mp3');
      const audioBuffer = new ArrayBuffer(8);
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });
      mockAudioContext.decodeAudioData.mockResolvedValueOnce(audioBuffer);

      // Act
      await audioManager.loadSoundEffect(effect);
      await audioManager.playSoundEffect('effect');
      audioManager.dispose();

      // Assert
      expect(audioManager.isDisposed()).toBe(true);
    });

    it('should handle audio context suspension/resumption', async () => {
      // Arrange
      mockAudioContext.suspend = jest.fn().mockResolvedValueOnce(undefined);
      mockAudioContext.resume = jest.fn().mockResolvedValueOnce(undefined);

      // Act
      await audioManager.suspend();
      await audioManager.resume();

      // Assert
      expect(mockAudioContext.suspend).toHaveBeenCalled();
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });
});