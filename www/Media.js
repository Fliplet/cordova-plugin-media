cordova.define("cordova-plugin-media.Media", function (require, exports, module) {
    /*
     *
     * Licensed to the Apache Software Foundation (ASF) under one
     * or more contributor license agreements.  See the NOTICE file
     * distributed with this work for additional information
     * regarding copyright ownership.  The ASF licenses this file
     * to you under the Apache License, Version 2.0 (the
     * "License"); you may not use this file except in compliance
     * with the License.  You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing,
     * software distributed under the License is distributed on an
     * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
     * KIND, either express or implied.  See the License for the
     * specific language governing permissions and limitations
     * under the License.
     *
    */

    var argscheck = require('cordova/argscheck'),
        utils = require('cordova/utils'),
        exec = require('cordova/exec');

    var mediaObjects = {};

    /**
     * This class provides access to the device media, interfaces to both sound and video
     *
     * @constructor
     * @param src                   The file name or url to play
     * @param successCallback       The callback to be called when the file is done playing or recording.
     *                                  successCallback()
     * @param errorCallback         The callback to be called if there is an error.
     *                                  errorCallback(int errorCode) - OPTIONAL
     * @param statusCallback        The callback to be called when media status has changed.
     *                                  statusCallback(int statusCode) - OPTIONAL
     * @param createCallback        The callback to be called when media object is created / retrieved.
     *                                  createCallback(boolean running) - OPTIONAL
     * @param mediaId               The id to set the media object to, when loading existing media objects - OPTIONAL
     */
    var Media = function (src, successCallback, errorCallback, statusCallback, createCallback, mediaId) {
        argscheck.checkArgs('sFFFFS', 'Media', arguments);

        if (mediaId) {
            this.id = mediaId;
            if (mediaObjects[this.id]) {
                this.node = mediaObjects[this.id].node;
                this._status = mediaObjects[this.id]._status;
            }
        } else {
            this.id = utils.createUUID();
        }

        mediaObjects[this.id] = this;
        this.src = src;
        this.successCallback = successCallback;
        this.errorCallback = errorCallback;
        this.statusCallback = statusCallback;
        this.createCallback = createCallback;
        this._duration = -1;
        this._position = -1;
        exec(this.createCallback, this.errorCallback, "Media", "create", [this.id, this.src]);
    };

    // Media messages
    Media.MEDIA_STATE = 1;
    Media.MEDIA_DURATION = 2;
    Media.MEDIA_POSITION = 3;
    Media.MEDIA_ERROR = 9;

    // Media states
    Media.MEDIA_NONE = 0;
    Media.MEDIA_STARTING = 1;
    Media.MEDIA_RUNNING = 2;
    Media.MEDIA_PAUSED = 3;
    Media.MEDIA_STOPPED = 4;
    Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

    // "static" function to create an object instance.
    Media.createItem = function (src, successCallback, errorCallback, statusCallback, createCallback, mediaId, onIdCallback) {
        var newMedia = new Media(src, successCallback, errorCallback, statusCallback, createCallback, mediaId);

        if (onIdCallback) {
            onIdCallback(newMedia.id);
        }
    };

    // "static" function to return existing objs.
    Media.get = function (id) {
        return mediaObjects[id];
    };

    // "static" function to return existing objs.
    Media.getAsync = function (id, getCallback) {
        if(getCallback) {
            getCallback(mediaObjects[id]);
        }
    };

    // "static" function to return existing obj list.
    Media.getAll = function () {
        return mediaObjects;
    };

    // "static" function to play an item.
    Media.playItem = function (id) {
        if (mediaObjects[id]) {
            mediaObjects[id].play();
        }
    };

    /**
     * Start or resume playing audio file.
     */
    Media.prototype.play = function (options) {
        exec(null, null, "Media", "startPlayingAudio", [this.id, this.src, options]);
    };

    // "static" function to stop an item.
    Media.stopItem = function (id) {
        if (mediaObjects[id]) {
            mediaObjects[id].stop();
        }
    };

    /**
     * Stop playing audio file.
     */
    Media.prototype.stop = function () {
        var me = this;
        exec(function () {
            me._position = 0;
        }, this.errorCallback, "Media", "stopPlayingAudio", [this.id]);
    };

     // "static" function to seek on an item.
     Media.seekItem = function (id, milliseconds) {
        if (mediaObjects[id]) {
            mediaObjects[id].seekTo(milliseconds);
        }
    };

    /**
     * Seek or jump to a new time in the track..
     */
    Media.prototype.seekTo = function (milliseconds) {
        var me = this;
        exec(function (p) {
            me._position = p;
        }, this.errorCallback, "Media", "seekToAudio", [this.id, milliseconds]);
    };

    // "static" function to pause an item.
    Media.pauseItem = function (id) {
        if (mediaObjects[id]) {
            mediaObjects[id].pause();
        }
    };

    /**
     * Pause playing audio file.
     */
    Media.prototype.pause = function () {
        exec(null, this.errorCallback, "Media", "pausePlayingAudio", [this.id]);
    };

    // "static" function to get the duration of an item.
    Media.getDurationOfItem = function (id, getCallback) {
        if (mediaObjects[id] && getCallback) {
            getCallback(mediaObjects[id].getDuration());
        }
    };

    /**
     * Get duration of an audio file.
     * The duration is only set for audio that is playing, paused or stopped.
     *
     * @return      duration or -1 if not known.
     */
    Media.prototype.getDuration = function () {
        return this._duration;
    };

    // "static" function to get the position of an item.
    Media.getItemCurrentPosition = function (id, success, fail) {
        if (mediaObjects[id]) {
            mediaObjects[id].getCurrentPosition(success, fail);
        }
    };

    /**
     * Get position of audio.
     */
    Media.prototype.getCurrentPosition = function (success, fail) {
        var me = this;
        exec(function (p) {
            me._position = p;
            success(p);
        }, fail, "Media", "getCurrentPositionAudio", [this.id]);
    };

    /**
     * Start recording audio file.
     */
    Media.prototype.startRecord = function () {
        exec(null, this.errorCallback, "Media", "startRecordingAudio", [this.id, this.src]);
    };

    /**
     * Stop recording audio file.
     */
    Media.prototype.stopRecord = function () {
        exec(null, this.errorCallback, "Media", "stopRecordingAudio", [this.id]);
    };

    /**
     * Pause recording audio file.
     */
    Media.prototype.pauseRecord = function () {
        exec(null, this.errorCallback, "Media", "pauseRecordingAudio", [this.id]);
    };

    /**
    * Resume recording audio file.
    */
    Media.prototype.resumeRecord = function () {
        exec(null, this.errorCallback, "Media", "resumeRecordingAudio", [this.id]);
    };

    // "static" function to release an item.
    Media.releaseItem = function (id) {
        if (mediaObjects[id]) {
            mediaObjects[id].release();
        }
    };

    /**
     * Release the resources.
     */
    Media.prototype.release = function () {
        exec(null, this.errorCallback, "Media", "release", [this.id]);
    };

    // "static" function to set the volume of an item.
    Media.setItemVolume = function (id, volume) {
        if (mediaObjects[id]) {
            mediaObjects[id].setVolume(volume);
        }
    };

    /**
     * Adjust the volume.
     */
    Media.prototype.setVolume = function (volume) {
        exec(null, null, "Media", "setVolume", [this.id, volume]);
    };

    /**
     * Adjust the playback rate.
     */
    Media.prototype.setRate = function (rate) {
        if (cordova.platformId === 'ios') {
            exec(null, null, "Media", "setRate", [this.id, rate]);
        } else {
            console.warn('media.setRate method is currently not supported for', cordova.platformId, 'platform.');
        }
    };

    // "static" function to get the amplitude of an item.
    Media.getItemAmplitude = function (id, success, fail) {
        if (mediaObjects[id]) {
            mediaObjects[id].getCurrentAmplitude(success, fail);
        }
    };

    /**
     * Get amplitude of audio.
     */
    Media.prototype.getCurrentAmplitude = function (success, fail) {
        exec(function (p) {
            success(p);
        }, fail, "Media", "getCurrentAmplitudeAudio", [this.id]);
    };

    /**
     * Audio has status update.
     * PRIVATE
     *
     * @param id            The media object id (string)
     * @param msgType       The 'type' of update this is
     * @param value         Use of value is determined by the msgType
     */
    Media.onStatus = function (id, msgType, value) {

        var media = mediaObjects[id];

        if (media) {
            switch (msgType) {
                case Media.MEDIA_STATE:
                    if (media.statusCallback) {
                        media.statusCallback(value);
                    }
                    if (value == Media.MEDIA_STOPPED) {
                        if (media.successCallback) {
                            media.successCallback();
                        }
                    }
                    break;
                case Media.MEDIA_DURATION:
                    media._duration = value;
                    break;
                case Media.MEDIA_ERROR:
                    if (media.errorCallback) {
                        media.errorCallback(value);
                    }
                    break;
                case Media.MEDIA_POSITION:
                    media._position = Number(value);
                    break;
                default:
                    if (console.error) {
                        console.error("Unhandled Media.onStatus :: " + msgType);
                    }
                    break;
            }
        } else if (console.error) {
            console.error("Received Media.onStatus callback for unknown media :: " + id);
        }

    };

    module.exports = Media;

    function onMessageFromNative(msg) {
        if (msg.action == 'status') {
            Media.onStatus(msg.status.id, msg.status.msgType, msg.status.value);
        } else {
            throw new Error('Unknown media action' + msg.action);
        }
    }

    if (cordova.platformId === 'android' || cordova.platformId === 'amazon-fireos' || cordova.platformId === 'windowsphone') {

        var channel = require('cordova/channel');

        channel.createSticky('onMediaPluginReady');
        channel.waitForInitialization('onMediaPluginReady');

        channel.onCordovaReady.subscribe(function () {
            exec(onMessageFromNative, undefined, 'Media', 'messageChannel', []);
            channel.initializationComplete('onMediaPluginReady');
        });
    }

});
