/**
 * @jest.test.js
 * Unit tests for BackgroundMusic module
 * 
 * @description Tests the background music functionality including loading,
 * playing, pausing, and volume control features
 */

import { BackgroundMusic } from '../../../src/audio/BackgroundMusic';
import { AudioLoadError } from '../../../src/audio/errors/AudioLoadError';

// Mock the Web Audio API
const mockAudioContext = {
  createGain: jest.fn(() => ({
    gain: { value: 1, setValueAtTime: jest.fn() },
    connect: jest.fn(),
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
};

// Mock the HTMLAudioElement
const mockAudio = {
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

describe('BackgroundMusic', () => {
  let backgroundMusic;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    global.AudioContext = jest.fn(() => mockAudioContext);
    global.Audio = jest.fn(() => mockAudio);
    
    backgroundMusic = new BackgroundMusic();
  });

  describe('initialization', () => {
    test('should create instance with default values', () => {
      expect(backgroundMusic).toBeDefined();
      expect(backgroundMusic.isPlaying).toBeFalsy();
      expect(backgroundMusic.volume).toBe(1.0);
    });

    test('should initialize audio context', () => {
      expect(global.AudioContext).toHaveBeenCalled();
    });
  });

  describe('loadTrack', () => {
    const validTrackUrl = 'assets/music/background.mp3';

    test('should load track successfully', async () => {
      const loadPromise = backgroundMusic.loadTrack(validTrackUrl);
      
      // Simulate successful load
      mockAudio.addEventListener.mock.calls[0][1]();
      
      await expect(loadPromise).resolves.toBeUndefined();
      expect(mockAudio.load).toHaveBeenCalled();
    });

    test('should handle track loading error', async () => {
      const invalidTrackUrl = 'invalid/path.mp3';
      const loadPromise = backgroundMusic.loadTrack(invalidTrackUrl);
      
      // Simulate error event
      mockAudio.addEventListener.mock.calls[1][1](new Error('Loading failed'));
      
      await expect(loadPromise).rejects.toThrow(AudioLoadError);
    });

    test('should throw error for invalid track URL', async () => {
      await expect(backgroundMusic.loadTrack('')).rejects.toThrow('Invalid track URL');
    });
  });

  describe('playback controls', () => {
    beforeEach(async () => {
      await backgroundMusic.loadTrack('test-track.mp3');
    });

    test('should play track', async () => {
      await backgroundMusic.play();
      
      expect(mockAudio.play).toHaveBeenCalled();
      expect(backgroundMusic.isPlaying).toBeTruthy();
    });

    test('should pause track', () => {
      backgroundMusic.pause();
      
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(backgroundMusic.isPlaying).toBeFalsy();
    });

    test('should handle play errors', async () => {
      mockAudio.play.mockRejectedValue(new Error('Playback failed'));
      
      await expect(backgroundMusic.play()).rejects.toThrow('Playback failed');
    });
  });

  describe('volume control', () => {
    test('should set volume within valid range', () => {
      backgroundMusic.setVolume(0.5);
      
      expect(backgroundMusic.volume).toBe(0.5);
      expect(mockAudioContext.createGain().gain.setValueAtTime)
        .toHaveBeenCalledWith(0.5, expect.any(Number));
    });

    test('should clamp volume to valid range', () => {
      backgroundMusic.setVolume(1.5);
      expect(backgroundMusic.volume).toBe(1.0);

      backgroundMusic.setVolume(-0.5);
      expect(backgroundMusic.volume).toBe(0.0);
    });
  });

  describe('cleanup', () => {
    test('should properly cleanup resources', () => {
      backgroundMusic.dispose();
      
      expect(mockAudio.removeEventListener).toHaveBeenCalled();
      expect(backgroundMusic.isPlaying).toBeFalsy();
    });
  });

  describe('error handling', () => {
    test('should handle audio context creation failure', () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported');
      });

      expect(() => new BackgroundMusic()).toThrow('AudioContext not supported');
    });
  });
});