class SkyUploader {

	Status = {
		READY: 0,
		SUCCESS: 1,
		UPLOAD: 2,
		PAUSE: 3,
		ERROR: -1,
	};
	
	container;
	handler;
	url        = '/upload';
	name       = 'file';
	autoUpload = true;
	usePreview = false;
	accept     = '';
	maxCount   = 1;
	maxProcess = 3;
	maxSize    = 20 * 1024 * 1024; // MB
	chunkSize  = 2 * 1024 * 1024; // MB
	data       = {};
	messages   = {
		MAX_COUNT: '업로드 가능한 파일 갯수를 초과하였습니다.',
		MAX_SIZE: '업로드 가능한 파일 크기를 초과한 파일이 제외되었습니다.',
		ALREADY_ADDED: '중복으로 추가된 파일이 제외되었습니다.',
		INVALID_RESPONSE: '서버 응답 오류',
		UPLOAD_FAIL: '업로드 실패',	
	};
	onAdd;
	onProgress;
	onSuccess;
	onDelete;
	onPause;
	onCancel;
	onFail;
	onError;

	input;
	inputContainer;
	files = [];
	processes = [];

	constructor(container, options) {
		this.option(options || {});
		this.initInput();
		this.initContainer(container);
		if (typeof options.handler !== 'undefined') {
			this.initHandler(options.handler)
		}
	}

	option(options) {
		const keys = [
			'url',
			'name',
			'autoUpload',
			'usePreview',
			'accept',
			'maxCount',
			'maxProcess',
			'maxSize',
			'chunkSize',
			'data',
			'onAdd',
			'onProgress',
			'onSuccess',
			'onDelete',
			'onPause',
			'onCancel',
			'onFail',
			'onError',
		];

		for (let key of keys) {
			if (typeof options[key] !== 'undefined') {
				this[key] = options[key];
			}
		}

		if (typeof options.messages === 'object') {
			this.messages = Object.assign(this.messages, options.messages);
		}
		
		// regards as MB if less than 1024
		if (this.maxSize < 1024) {
			this.maxSize *= 1024 * 1024;
		}
		if (this.chunkSize < 1024) {
			this.chunkSize *= 1024 * 1024;
		}
	}

	initInput() {
		// remove input if exists
		if (this.input) {
			this.input.remove();
		}

		const input = document.createElement('input');
		input.setAttribute('type', 'file');
		input.className = 'sky-hidden-input';
		if (this.maxCount > 1) {
			input.setAttribute('multiple', 'multiple');
		}
		if (this.accept) {
			input.setAttribute('accept', this.accept);
		}
		input.style.display = 'none';
		input.addEventListener('change', e => {
			this.add(e.target.files);
		});

		this.input = input;
		(this.inputContainer || document.body).appendChild(this.input);
	}

	initContainer(container) {
		this.container = typeof container === 'string' ? document.querySelector(container) : container;
		this.container.classList.add('sky-file-container');
		this.applyContainerStatus();

		this.container.addEventListener('click', _ => {
			this.browse();
		});
		this.container.addEventListener('dragover', e => {
			e.preventDefault();
			this.container.classList.add('sky-drag-over')
		});
		this.container.addEventListener('dragleave', e => {
			e.preventDefault();
			this.container.classList.remove('sky-drag-over')
		});
		this.container.addEventListener('drop', e => {
			e.preventDefault();

			if (e.dataTransfer.files) {
				this.add(e.dataTransfer.files);
			}
			this.container.classList.remove('sky-drag-over')
		});
	}

	initHandler(handler) {
		this.handler = typeof handler === 'string' ? document.querySelector(handler) : handler;

		this.handler.addEventListener('click', _ => {
			this.browse();
		});
	}

	browse() {
		let count = this.getCount();
		if (count < this.maxCount) {
			this.input.click();
		} else {
			this.error(this.messages.MAX_COUNT);
		}
	}

	add(files) {
		let count = this.getCount();

		let flagSize = false;
		let flagDuplicated = false;
		for (let file of files) {
			if (count >= this.maxCount) {
				this.error(this.messages.MAX_COUNT);
				break;
			}

			if (file.size > this.maxSize) {
				flagSize = true;
				continue;
			}

			file.id = this.getFileId(file);
			
			if (this.alreadyAdded(file)) {
				flagDuplicated = true;
				continue;
			}
			
			file.index  = this.files.length;
			file.status = this.Status.READY;
			file.offset = 0;
			this.files.push(file);
			count++;

			this.renderFileView(file);

			this.callback(this.onAdd, [file]);

			if (this.autoUpload) {
				this.upload(file);
			}
		}
	
		if (flagSize) {
			this.error(this.messages.MAX_SIZE);
		}
		if (flagDuplicated) {
			this.error(this.messages.ALREADY_ADDED);
		}
	}
	
	alreadyAdded(file) {
		return !!this.files.find(v => v.id === file.id);
	}

	getCount() {
		let count = 0;
		for (let file of this.files) {
			if (file) {
				count++;
			}
		}
		return count;
	}

	start() {
		let promises = [];
		for (let file of this.files) {
			if (file && file.status === this.Status.READY) {
				promises.push(this.upload(file));
			}
		}

		return Promise.all(promises);
	}

	action(file) {
		if (file.status === this.Status.UPLOAD) {
			this.abort(file);
		} else {
			this.upload(file);
		}
	}

	async upload(file) {
		while (!this.availProcess()) {
			await this.sleep(200);			
		}
		this.addToProcess(file);
		this.applyFileStatus(file, this.Status.UPLOAD);

		do {
			this.progress(file);

			let result = await this.request(file).catch(_ => {
				return false;
			});
			if (result === false || result.success === false || result.offset <= file.offset) {
				this.renderFileError(file, result.message)
				break;
			}

			if (result.file) {
				file.result = result.file;
				this.success(file);
				break;
			}

			file.offset = result.offset;

			if (file.status !== this.Status.UPLOAD) {
				this.progress(file);
				break;
			}

		} while (file.offset < file.size);
	}

	request(file) {
		return new Promise((resolve, reject) => {
			const offset = file.offset;

			let part    = this.getFilePart(file, offset, this.chunkSize);
			part.id     = file.id;
			part.total  = file.size;
			part.offset = file.offset;

			let formData = this.getFormData(part, this.data);

			const request = file.request = new XMLHttpRequest();
			request.open('POST', this.url);

			request.upload.onprogress = e => {
				const total  = file.size;
				const loaded = offset + e.loaded - (e.total - part.size);
				const percent = this.percent(loaded, total);
				this.progress(file, percent);
			}
			request.onload = e => {
				try {
					const result = JSON.parse(e.target.responseText);
					console.log(result);

					delete(file.request);
					if (result.success) {
						resolve(result);
					} else {
						resolve(false);
					}
				} catch (e) {
					this.renderFileError(file, this.messages.INVALID_RESPONSE);
					reject();
				}
			}
			request.onerror = _ => {
				this.renderFileError(file, this.messages.UPLOAD_FAIL);
				reject();
			}
			request.send(formData);
		});
	}

	getFilePart(file, offset = 0, chunk_size = 0) {
		if (chunk_size) {
			return new File([file.slice(offset, offset + chunk_size)], file.name, {
				type: file.type,
				lastModified: file.lastModified,
			});
		}

		return file;
	}

	getFormData(file, data) {
		const formData = new FormData();
		formData.append('id', file.id);
		formData.append('total', file.total);
		formData.append('offset', file.offset);
		if (data) {
			for (let key in data) {
				this.appendToFormData(formData, key, data[key]);
			}
		}
		formData.append('file', file);

		return formData;
	}

	appendToFormData(formData, key, value) {
		if (Array.isArray(value)) {
			// array
			value.forEach((item, index) => {
				this.appendToFormData(formData, `${key}[${index}]`, item);
			});
		} else if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
			// object except File, Blob
			for (const subKey in value) {
				this.appendToFormData(formData, `${key}[${subKey}]`, value[subKey]);
			}
		} else {
			formData.append(key, value);
		}
	}

	percent(loaded, total) {
		return Math.round(100 * loaded / total, 2);
	}

	progress(file, percent) {
		if (typeof percent === 'undefined') {
			percent = this.percent(file.offset || 0, file.size);
		}


		const progress = file.view.progress;
		progress.value = percent;
		progress.innerText = percent + ' %';

		this.callback(this.onProgress, [percent, file]);
	}

	success(file) {
		this.removeFromProcess(file);
		this.progress(file, 100);

		file.offset = file.size;
		file.view.inputName.value = file.name;
		file.view.inputPath.value = file.result;
		file.view.inputSize.value = file.size;

		this.applyFileStatus(file, this.Status.SUCCESS);

		this.callback(this.onSuccess, [file]);
	}

	delete(file) {
		this.removeFromProcess(file);
		if (file.status === this.Status.UPLOAD) {
			file.request.abort();
		}
		file.view.remove();

		delete this.files[file.index];
		file = undefined;

		this.applyContainerStatus();

		this.callback(this.onDelete, [file]);
	}

	abort(file) {
		this.removeFromProcess(file);
		if (file.offset > 0) {
			this.applyFileStatus(file, this.Status.PAUSE);
			this.callback(this.onPause, [file]);
		} else {
			this.applyFileStatus(file, this.Status.READY);
			this.callback(this.onCancel, [file]);
		}
	}

	error(msg) {
		if (typeof this.onError === 'function') {
			this.onError(msg);
		} else {
			alert(msg);
		}
	}

	callback(func, args) {
		if (typeof func === 'function') {
			func.apply(this, args);
		}
	}

	renderFileView(file) {
		const view = file.view = document.createElement('div');
		view.classList.add('sky-file-item', `item-${file.index}`, 'ready');

		view.append(
			view.inputName = this.createElement(`<input type="hidden" name="${this.name}[${file.index}][name]" value="">`),
			view.inputPath = this.createElement(`<input type="hidden" name="${this.name}[${file.index}][path]" value="">`),
			view.inputSize = this.createElement(`<input type="hidden" name="${this.name}[${file.index}][size]" value="">`),
			view.preview = this.createElement(`<div class="sky-file-preview"></div>`),
			view.name = this.createElement(`<div class="sky-file-name" title="${file.name}">${file.name}</div>`),
			view.size = this.createElement(`<div class="sky-file-size">${this.formatFileSize(file.size)}</div>`),
			view.btnAction = this.createElement(`<button class="sky-btn-action"></button>`),
			view.btnDelete = this.createElement(`<button class="sky-btn-delete"></button>`),
			view.progress = this.createElement(`<progress max="100" value="0">0 %</progress>`),
			view.error = this.createElement(`<div class="sky-file-error">Error</div>`),
		);

		view.addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();
		});
		view.btnAction.addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();
			this.action(file);
		});
		view.btnDelete.addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();
			this.delete(file);
		});

		if (this.usePreview) {
			this.renderFilePreview(file);
		} else {
			view.preview.style.display = 'none';
		}

		this.container.appendChild(view);

		this.applyContainerStatus();
	}

	renderFilePreview(file) {
		// use css class based on file extension
		// ex) foobar.zip --> .file-zip
		const extension = file.name.split('.').pop().toLowerCase();
		file.view.preview.classList.add(`file-${extension}`);

		if (file.type.indexOf('image/') === 0) {
			this.dataURL(file).then(dataUrl => {
				file.view.preview.style.backgroundImage = `url("${dataUrl}")`;
			});
		}
	}

	renderFileError(file, msg) {
		this.removeFromProcess(file);
		file.view.error.innerHTML = msg || this.messages.UPLOAD_FAIL;
		this.applyFileStatus(file, this.Status.ERROR);
		this.progress(file)

		this.callback(this.onFail, [file]);
	}

	applyContainerStatus() {
		const exists = !!this.container.querySelector('.sky-file-item');
		this.container.classList.toggle('empty', !exists);
		this.container.classList.toggle('exists', exists);
	}

	applyFileStatus(file, status) {
		file.status = status;
		file.view.classList.remove('ready', 'upload', 'success', 'pause', 'error');

		if (file.status === this.Status.READY) {
			file.view.classList.add('ready');
		} else if (file.status === this.Status.UPLOAD) {
			file.view.classList.add('upload');
		} else if (file.status === this.Status.SUCCESS) {
			file.view.classList.add('success');
		} else if (file.status === this.Status.PAUSE) {
			file.view.classList.add('pause');
		} else if (file.status === this.Status.ERROR) {
			file.view.classList.add('error');
		} else {
			// nothing			
		}
	}

	formatFileSize(size) {
		if (size < 1024) {
			return size.toLocaleString() + ' B';
		}
		if (size < 1024 * 1024) {
			return Math.round(size / 1024).toLocaleString() + ' KB';
		}
		if (size < 1024 * 1024 * 1024) {
			return Math.round(size / (1024 * 1024)).toLocaleString() + ' MB';
		}
		return Math.round(size / (1024 * 1024 * 1024)).toLocaleString() + ' GB';
	}

	getFileId(file) {
		return file.name + '-' + file.size + '-' + file.lastModified;
	}

	dataURL(file) {
		return new Promise((resolve, reject) => {
			const reader  = new FileReader();
			reader.onload = function () {
				resolve(this.result);
			}
			reader.onerror  = function () {
				reject();
			}
			reader.readAsDataURL(file);
		})
	}

	createElement(html) {
		let template = document.createElement('template');
		template.innerHTML = html.trim();
		return template.content.firstChild;
	}
	
	availProcess() {
		return this.processes.length < this.maxProcess;
	}
	
	addToProcess(file) {
		console.log('end :', file.index);
		this.processes.push(file);
	}
	
	removeFromProcess(file) {
		let index = this.processes.indexOf(file);
		if (index !== -1) {
			this.processes.splice(index, 1);
		}
	}
	
	sleep(milliseconds) {
		return new Promise(resolve => setTimeout(resolve, milliseconds));
	}
}
