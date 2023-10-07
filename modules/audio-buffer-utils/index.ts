/**
 * original code https://github.com/audiojs/audio-buffer-utils
 * original license MIT
 *
 * my changes: works with es6 modules, removed some unused code, removed node support, typescriptified,
 * watch for return types, I changed some of these too
 *
 * @module  audio-buffer-utils
 */
import * as Tone from 'tone/Tone';

const clamp = function clamp(value: number, min: number, max: number) {
	return min < max
		? (value < min ? min : value > max ? max : value)
		: (value < max ? max : value > min ? min : value)
}

const isAudioBuffer = (buffer: any) => {
	//the guess is duck-typing
	return buffer != null
		&& typeof buffer.length === 'number'
		&& typeof buffer.sampleRate === 'number' //swims like AudioBuffer
		&& typeof buffer.getChannelData === 'function' //quacks like AudioBuffer
		&& typeof buffer.duration === 'number'
};

const createBuffer = function (url?: string | Tone.ToneAudioBuffer | AudioBuffer): Tone.ToneAudioBuffer {
	return new Tone.ToneAudioBuffer(url)
}

const isNeg = function (number: number) {
	return number === 0 && (1 / number) === -Infinity;
};

const nidx = function negIdx(idx: number, length: number) {
	return idx == null ? 0 : isNeg(idx) ? length : idx <= -length ? 0 : idx < 0 ? (length + (idx % length)) : Math.min(length, idx);
}

const utils = {
	create: create,
	copy: copy,
	shallow: shallow,
	clone: clone,
	reverse: reverse,
	invert: invert,
	zero: zero,
	noise: noise,
	equal: equal,
	fill: fill,
	slice: slice,
	concat: concat,
	resize: resize,
	pad: pad,
	padLeft: padLeft,
	padRight: padRight,
	rotate: rotate,
	shift: shift,
	normalize: normalize,
	removeStatic: removeStatic,
	trim: trim,
	trimLeft: trimLeft,
	trimRight: trimRight,
	mix: mix,
	size: size,
	data: data,
	subbuffer: subbuffer,
	repeat: repeat
}

export default utils

/**
 * Create buffer from any argument.
 * Better constructor than audio-buffer.
 */
function create(src: any) {
	return new Tone.ToneAudioBuffer(src)
}


/**
 * Copy data from buffer A to buffer B
 */
function copy(from: Tone.ToneAudioBuffer, to: Tone.ToneAudioBuffer, offset?: number) {
	offset = offset || 0;
	
	for (let channel = 0, l = Math.min(from.numberOfChannels, to.numberOfChannels); channel < l; channel++) {
		to.getChannelData(channel).set(from.getChannelData(channel), offset);
	}
	
	return to;
}

/**
 * Create a buffer with the same characteristics as inBuffer, without copying
 * the data. Contents of resulting buffer are undefined.
 */
function shallow(buffer: Tone.ToneAudioBuffer) {
	return create(buffer.length);
}


/**
 * Create clone of a buffer
 */
function clone(buffer: Tone.ToneAudioBuffer) {
	return copy(buffer, shallow(buffer));
}


/**
 * Reverse buffer. Place data to target buffer, if any, otherwise modify buffer in-place.
 */
function reverse(buffer: Tone.ToneAudioBuffer, target: Tone.ToneAudioBuffer | any, start: any, end: any) {
	if (!isAudioBuffer(target) && target != null) {
		end = start;
		start = target;
		target = null;
	}
	
	if (target) {
		copy(buffer, target);
	} else {
		target = buffer;
	}
	
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);
	
	for (let i = 0, c = target.numberOfChannels; i < c; ++i) {
		target.getChannelData(i).subarray(start, end).reverse();
	}
	
	return target;
}


/**
 * Invert amplitude of samples in each channel
 * Reverse buffer. Place data to target buffer, if any, otherwise modify buffer in-place.
 */
function invert(buffer: Tone.ToneAudioBuffer, target: any, start: any, end: any) {
	//if target buffer is passed
	if (!isAudioBuffer(target) && target != null) {
		end = start;
		start = target;
		target = null;
	}
	
	return fill(buffer, target, function (sample: any) {
		return -sample;
	}, start, end);
}


/**
 * Fill with zeros
 */
function zero(buffer: Tone.ToneAudioBuffer, target: any, start: any, end: any) {
	return fill(buffer, target, 0, start, end);
}


/**
 * Fill with white noise
 */
function noise(buffer: Tone.ToneAudioBuffer, target: any, start: any, end: any) {
	return fill(buffer, target, function (sample: any) {
		return Math.random() * 2 - 1;
	}, start, end);
}


/**
 * Test whether two buffers are the same
 */
function equal(bufferA: Tone.ToneAudioBuffer, bufferB: Tone.ToneAudioBuffer) {
	//walk by all the arguments
	if (arguments.length > 2) {
		for (let i = 0, l = arguments.length - 1; i < l; i++) {
			// eslint-disable-next-line prefer-rest-params
			if (!equal(arguments[i], arguments[i + 1])) return false;
		}
		return true;
	}
	
	if (bufferA.length !== bufferB.length || bufferA.numberOfChannels !== bufferB.numberOfChannels) return false;
	
	for (let channel = 0; channel < bufferA.numberOfChannels; channel++) {
		const dataA = bufferA.getChannelData(channel);
		const dataB = bufferB.getChannelData(channel);
		
		for (let i = 0; i < dataA.length; i++) {
			if (dataA[i] !== dataB[i]) return false;
		}
	}
	
	return true;
}


/**
 * Generic in-place fill/transform
 */
function fill(buffer: Tone.ToneAudioBuffer, target?: any, value?: any, start?: any, end?: any) {
	
	//if target buffer is passed
	if (!isAudioBuffer(target) && target != null) {
		//target is bad argument
		if (typeof value == 'function') {
			target = null;
		} else {
			end = start;
			start = value;
			value = target;
			target = null;
		}
	}
	
	if (!target) {
		target = buffer;
	}
	
	//resolve optional start/end args
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);
	//resolve type of value
	if (!(value instanceof Function)) {
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			const targetData = target.getChannelData(channel);
			for (let i = start; i < end; i++) {
				targetData[i] = value
			}
		}
	} else {
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			const data = buffer.getChannelData(channel),
				targetData = target.getChannelData(channel);
			for (let i = start; i < end; i++) {
				targetData[i] = value.call(buffer, data[i], i, channel, data);
			}
		}
	}
	
	return target;
}

/**
 * Repeat buffer
 */
function repeat(buffer: Tone.ToneAudioBuffer, times: number) {
	
	if (!times || times < 0) return new Tone.ToneAudioBuffer()
	
	if (times === 1) return buffer
	
	const bufs = []
	for (let i = 0; i < times; i++) {
		bufs.push(buffer)
	}
	
	return concat(...bufs)
}

/**
 * Return sliced buffer
 */
function slice(buffer: Tone.ToneAudioBuffer, start: number | null, end: number | null) {
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);
	
	const data = [];
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const channelData = buffer.getChannelData(channel)
		data.push(channelData.slice(start, end));
	}
	
	return data;
}

/**
 * Create handle for a buffer from subarrays
 */
function subbuffer(buffer: Tone.ToneAudioBuffer, start: any, end: any, channels: any) {
	if (Array.isArray(start)) {
		channels = start
		start = 0;
		end = -0;
	} else if (Array.isArray(end)) {
		channels = end
		end = -0;
	}
	
	if (!Array.isArray(channels)) {
		channels = Array(buffer.numberOfChannels)
		for (let c = 0; c < buffer.numberOfChannels; c++) {
			channels[c] = c
		}
	}
	
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);
	
	const data = [];
	for (let i = 0; i < channels.length; i++) {
		const channel = channels[i]
		const channelData = buffer.getChannelData(channel)
		data.push(channelData.subarray(start, end));
	}
	
	//null-context buffer covers web-audio-api buffer functions
	const buf = new Tone.ToneAudioBuffer()
	
	//FIXME: not reliable hack to replace data. Mb use audio-buffer-list?
	buf.fromArray(data)
	
	return buf
}

/**
 * Concat buffer with other buffer(s)
 */
function concat(...args: Tone.ToneAudioBuffer[]) {
	const list: Tone.ToneAudioBuffer[] = []
	
	for (let i = 0, l = args.length; i < l; i++) {
		const arg = args[i]
		if (Array.isArray(arg)) {
			for (let j = 0; j < arg.length; j++) {
				list.push(arg[j])
			}
		} else {
			list.push(arg)
		}
	}
	
	let channels = 1;
	let length = 0;
	//FIXME: there might be required more thoughtful resampling, but now I'm lazy sry :(
	let sampleRate = 0;
	
	for (let i = 0; i < list.length; i++) {
		const buf = list[i]
		length += buf.length
		channels = Math.max(buf.numberOfChannels, channels)
		sampleRate = Math.max(buf.sampleRate, sampleRate)
	}
	
	const data = [];
	for (let channel = 0; channel < channels; channel++) {
		const channelData = new Float32Array(length);
		let offset = 0
		
		for (let i = 0; i < list.length; i++) {
			const buf = list[i]
			if (channel < buf.numberOfChannels) {
				channelData.set(buf.getChannelData(channel), offset);
			}
			offset += buf.length
		}
		
		data.push(channelData);
	}
	
	return create(data);
}


/**
 * Change the length of the buffer, by trimming or filling with zeros
 */
function resize(buffer: Tone.ToneAudioBuffer, length: number) {
	if (length < buffer.length) return slice(buffer, 0, length);
	
	return concat(buffer, create(length - buffer.length));
}


/**
 * Pad buffer to required size
 */
function pad(a: Tone.ToneAudioBuffer | number, b: Tone.ToneAudioBuffer | number, value?: number) {
	let buffer: Tone.ToneAudioBuffer;
	let length: number;
	
	if (typeof a === 'number') {
		buffer = b as Tone.ToneAudioBuffer;
		length = a as number;
	} else {
		buffer = a;
		length = b as number;
	}
	
	value = value || 0;
	
	//no need to pad
	if (length < buffer.length) return buffer;
	
	//left-pad
	if (buffer === b) {
		return concat(
			fill(create(length - buffer.length), value), buffer);
	}
	
	//right-pad
	return concat(buffer, fill(create(length - buffer.length), value));
}

function padLeft(data: any, len: any, value: any) {
	return pad(len, data, value)
}

function padRight(data: any, len: any, value: any) {
	return pad(data, len, value)
}


/**
 * Shift content of the buffer in circular fashion
 */
function rotate(buffer: Tone.ToneAudioBuffer, offset: number) {
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const cData = buffer.getChannelData(channel);
		const srcData = cData.slice();
		for (let i = 0, l = cData.length, idx; i < l; i++) {
			idx = (offset + (offset + i < 0 ? l + i : i)) % l;
			cData[idx] = srcData[i];
		}
	}
	
	return buffer;
}


/**
 * Shift content of the buffer
 */
function shift(buffer: Tone.ToneAudioBuffer, offset: number) {
	
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const cData = buffer.getChannelData(channel);
		if (offset > 0) {
			for (let i = cData.length - offset; i--;) {
				cData[i + offset] = cData[i];
			}
		} else {
			for (let i = -offset, l = cData.length - offset; i < l; i++) {
				cData[i + offset] = cData[i] || 0;
			}
		}
	}
	
	return buffer;
}


/**
 * Normalize buffer by the maximum value,
 * limit values by the -1..1 range
 */
function normalize(buffer: Tone.ToneAudioBuffer, target: Tone.ToneAudioBuffer | null = null, start: number, end: number) {
	//resolve optional target arg
	if (!isAudioBuffer(target)) {
		end = start;
		start = target as unknown as number;
		target = null;
	}
	
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);
	
	//for every channel bring it to max-min amplitude range
	let max = 0
	
	for (let c = 0; c < buffer.numberOfChannels; c++) {
		const data = buffer.getChannelData(c)
		for (let i = start; i < end; i++) {
			max = Math.max(Math.abs(data[i]), max)
		}
	}
	
	const amp = Math.max(1 / max, 1)
	
	return fill(buffer, target, function (value: any, i: any, ch: any) {
		return clamp(value * amp, -1, 1)
	}, start, end);
}

/**
 * remove DC offset
 */
function removeStatic(buffer: Tone.ToneAudioBuffer, target: Tone.ToneAudioBuffer, start: number, end: number) {
	const means = mean(buffer, start, end)
	
	return fill(buffer, target, function (value: any, i: any, ch: any) {
		return value - means[ch];
	}, start, end);
}

/**
 * Get average level per-channel
 */
function mean(buffer: Tone.ToneAudioBuffer, start: number, end: number) {
	
	start = start == null ? 0 : nidx(start, buffer.length);
	end = end == null ? buffer.length : nidx(end, buffer.length);
	
	if (end - start < 1) return []
	
	const result = []
	
	for (let c = 0; c < buffer.numberOfChannels; c++) {
		let sum = 0
		const data = buffer.getChannelData(c)
		for (let i = start; i < end; i++) {
			sum += data[i]
		}
		result.push(sum / (end - start))
	}
	
	return result
}


/**
 * Trim sound (remove zeros from the beginning and the end)
 */
function trim(buffer: Tone.ToneAudioBuffer, level: number) {
	return trimInternal(buffer, level, true, true);
}

function trimLeft(buffer: Tone.ToneAudioBuffer, level: number) {
	return trimInternal(buffer, level, true, false);
}

function trimRight(buffer: Tone.ToneAudioBuffer, level: number) {
	return trimInternal(buffer, level, false, true);
}

function trimInternal(buffer: Tone.ToneAudioBuffer, level: number, trimLeft: boolean, trimRight: boolean) {
	
	level = (level == null) ? 0 : Math.abs(level);
	
	let start, end;
	
	if (trimLeft) {
		start = buffer.length;
		//FIXME: replace with indexOF
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			const data = buffer.getChannelData(channel);
			for (let i = 0; i < data.length; i++) {
				if (i > start) break;
				if (Math.abs(data[i]) > level) {
					start = i;
					break;
				}
			}
		}
	} else {
		start = 0;
	}
	
	if (trimRight) {
		end = 0;
		//FIXME: replace with lastIndexOf
		for (let channel = 0, c = buffer.numberOfChannels; channel < c; channel++) {
			const data = buffer.getChannelData(channel);
			for (let i = data.length - 1; i >= 0; i--) {
				if (i < end) break;
				if (Math.abs(data[i]) > level) {
					end = i + 1;
					break;
				}
			}
		}
	} else {
		end = buffer.length;
	}
	
	return slice(buffer, start, end);
}


/**
 * Mix current buffer with the other one.
 * The reason to modify bufferA instead of returning the new buffer
 * is reduced amount of calculations and flexibility.
 * If required, the cloning can be done before mixing, which will be the same.
 */
function mix(bufferA: Tone.ToneAudioBuffer, bufferB: Tone.ToneAudioBuffer, ratio: number | ((a: number, b: number) => number), offset: number) {
	
	if (ratio == null) ratio = 0.5;
	const fn = ratio instanceof Function ? ratio : function (a: number, b: number) {
		return a * (1 - <number>ratio) + b * <number>ratio;
	};
	
	if (offset == null) offset = 0;
	else if (offset < 0) offset += bufferA.length;
	
	for (let channel = 0; channel < bufferA.numberOfChannels; channel++) {
		const aData = bufferA.getChannelData(channel);
		const bData = bufferB.getChannelData(channel);
		
		for (let i = offset, j = 0; i < bufferA.length && j < bufferB.length; i++, j++) {
			aData[i] = fn.call(bufferA, aData[i], bData[j]);
		}
	}
	
	return bufferA;
}


/**
 * Size of a buffer, in bytes
 */
function size(buffer: Tone.ToneAudioBuffer) {
	return buffer.numberOfChannels * buffer.getChannelData(0).byteLength;
}


/**
 * Return array with buffer’s per-channel data
 */
function data(buffer: Tone.ToneAudioBuffer, data: any[]) {
	
	//ensure output data array, if not defined
	data = data || [];
	
	//transfer data per-channel
	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		if (ArrayBuffer.isView(data[channel])) {
			data[channel].set(buffer.getChannelData(channel));
		} else {
			data[channel] = buffer.getChannelData(channel);
		}
	}
	
	return data;
}
