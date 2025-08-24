// tests/unit/audio/AudioManager.test.js

import { jest } from '@jest/globals';

// Mock the Audio API since it's not available in Jest's environment
class AudioMock {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.volume = 1;
    this.loop = false;
    this.paused = true;
    this.muted = false;
    this.playPromise = Promise.resolve();
  }

  play() {
    this.paused = false;
    return this.playPromise;
  }

  pause() {
    this.paused = true;
  }
}

global.Audio = AudioMock;

// Import the AudioManager class (assuming it's implemented)
import AudioManager from '../../../src/audio/AudioManager';

describe('AudioManager', () => {
  let audioManager;
  
  // Sample audio configurations for testing
  const testAudioConfig = {
    sounds: {
      'jump': 'assets/sounds/jump.mp3',
      'collect': 'assets/sounds/collect.mp3'
    },
    music: {
      'background': 'assets/music/background.mp3',
      'boss': 'assets/music/boss.mp3'
    }
  };

  beforeEach(() => {
    // Clear all mocks and create a fresh instance before each test
    jest.clearAllMocks();
    audioManager = new AudioManager(testAudioConfig);
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(audioManager.isSoundEnabled()).toBe(true);
      expect(audioManager.isMusicEnabled()).toBe(true);
      expect(audioManager.getMasterVolume()).toBe(1.0);
    });

    test('should load audio configuration correctly', () => {
      expect(audioManager.getLoadedSounds()).toEqual(
        expect.arrayContaining(['jump', 'collect'])
      );
      expect(audioManager.getLoadedMusic()).toEqual(
        expect.arrayContaining(['background', 'boss'])
      );
    });
  });

  describe('Sound Effects', () => {
    test('should play sound effect successfully', async () => {
      const playSpy = jest.spyOn(AudioMock.prototype, 'play');
      await audioManager.playSound('jump');
      expect(playSpy).toHaveBeenCalled();
    });

    test('should not play sound when sounds are disabled', async () => {
      audioManager.disableSounds();
      const playSpy = jest.spyOn(AudioMock.prototype, 'play');
      await audioManager.playSound('jump');
      expect(playSpy).not.toHaveBeenCalled();
    });

    test('should throw error for non-existent sound', async () => {
      await expect(audioManager.playSound('nonexistent'))
        .rejects
        .toThrow('Sound "nonexistent" not found');
    });

    test('should adjust sound volume correctly', async () => {
      audioManager.setSoundVolume(0.5);
      await audioManager.playSound('jump');
      const sound = audioManager.getCurrentlyPlayingSound();
      expect(sound.volume).toBe(0.5);
    });
  });

  describe('Background Music', () => {
    test('should play background music successfully', async () => {
      const playSpy = jest.spyOn(AudioMock.prototype, 'play');
      await audioManager.playMusic('background');
      expect(playSpy).toHaveBeenCalled();
    });

    test('should loop background music', async () => {
      await audioManager.playMusic('background');
      const music = audioManager.getCurrentlyPlayingMusic();
      expect(music.loop).toBe(true);
    });

    test('should transition between tracks smoothly', async () => {
      await audioManager.playMusic('background');
      const fadeOutSpy = jest.spyOn(audioManager, 'fadeOut');
      const fadeInSpy = jest.spyOn(audioManager, 'fadeIn');
      
      await audioManager.transitionToMusic('boss', 1000);
      
      expect(fadeOutSpy).toHaveBeenCalled();
      expect(fadeInSpy).toHaveBeenCalled();
    });

    test('should pause and resume music correctly', async () => {
      await audioManager.playMusic('background');
      audioManager.pauseMusic();
      const music = audioManager.getCurrentlyPlayingMusic();
      expect(music.paused).toBe(true);

      audioManager.resumeMusic();
      expect(music.paused).toBe(false);
    });
  });

  describe('Volume Control', () => {
    test('should adjust master volume correctly', () => {
      audioManager.setMasterVolume(0.7);
      expect(audioManager.getMasterVolume()).toBe(0.7);
    });

    test('should clamp volume values to valid range', () => {
      audioManager.setMasterVolume(1.5);
      expect(audioManager.getMasterVolume()).toBe(1.0);

      audioManager.setMasterVolume(-0.5);
      expect(audioManager.getMasterVolume()).toBe(0.0);
    });

    test('should apply master volume to all active sounds', async () => {
      await audioManager.playSound('jump');
      await audioManager.playMusic('background');
      
      audioManager.setMasterVolume(0.5);
      
      const sound = audioManager.getCurrentlyPlayingSound();
      const music = audioManager.getCurrentlyPlayingMusic();
      
      expect(sound.volume).toBe(0.5);
      expect(music.volume).toBe(0.5);
    });
  });

  describe('Error Handling', () => {
    test('should handle audio loading failures gracefully', async () => {
      // Simulate a loading error
      global.Audio = class extends AudioMock {
        constructor() {
          super();
          throw new Error('Failed to load audio');
        }
      };

      await expect(audioManager.loadSound('error'))
        .rejects
        .toThrow('Failed to load audio');
    });

    test('should handle playback errors gracefully', async () => {
      const errorAudio = new AudioMock();
      errorAudio.play = () => Promise.reject(new Error('Playback failed'));
      
      jest.spyOn(audioManager, 'createAudio').mockReturnValue(errorAudio);
      
      await expect(audioManager.playSound('jump'))
        .rejects
        .toThrow('Playback failed');
    });
  });

  describe('Resource Management', () => {
    test('should clean up resources when destroyed', () => {
      const pauseSpy = jest.spyOn(AudioMock.prototype, 'pause');
      audioManager.destroy();
      
      expect(pauseSpy).toHaveBeenCalled();
      expect(audioManager.getLoadedSounds().length).toBe(0);
      expect(audioManager.getLoadedMusic().length).toBe(0);
    });
  });
});