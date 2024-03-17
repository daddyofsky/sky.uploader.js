[한국어 문서 읽기](README.md)

# Sky Uploader

Sky Uploader is a JavaScript library that facilitates easy integration of file upload functionalities into web pages.

Sky Uploader offers features for handling file uploads, including:

- **Multiple File Uploads**: Allows users to select and upload several files simultaneously.
- **Chunked Uploads**: Splits large files into smaller chunks for upload to prevent timeouts and ensure data integrity.
- **Drag and Drop**: Simplifies file selection with an intuitive drag-and-drop interface.
- **File Type and Size Restrictions**: Limits the types and sizes of files that can be uploaded.
- **Upload Progress Indication**: Visually displays detailed progress information.

## Getting Started

Integrating Sky Uploader into your project is straightforward. After downloading, it can be directly included on a web page.

### Download and Use

The Sky Uploader library can be downloaded from GitHub.

- [Sky Uploader GitHub](https://raw.githubusercontent.com/daddyofsky/sky.uploader.js/main/sky.uploader.js)

After downloading, save the file to an appropriate location in your web project, then include it in your HTML file with a script tag.

#### HTML

```html
<script type="text/javascript" src="path/to/sky.uploader.js"></script>
<div id="file-box"></div>
```

#### JavaScript

Initialize the library and set your options:

```javascript
const uploader = new SkyUploader('#file-box', {
  url: 'https://your-upload-endpoint.com/upload',
  maxCount: 5,
});
```

## Usage Examples

### Using a File Selection Button

This method involves using a separate button for file selection.

#### HTML

```html
<!-- File selection button -->
<button id="btn-browse" type="button">Select Files</button>
<!-- Area to display selected files -->
<div id="file-box"></div>
```

#### JavaScript

Use the `handler` option to specify the file selection button. The necessary event listeners will be added automatically.

```javascript
const uploader = new SkyUploader('#file-box', {
  handler: '#btn-browse',
  ...
});
```

### Using an Upload Start Button

This method allows users to select files without automatically uploading them. Users can click a button to upload all selected files at once.

#### HTML

```html
<style>
  /* Hide individual file upload buttons for files in the ready state */
  #file-box .sky-file-item.ready .sky-btn-action { display:none; }
</style>
<!-- Area for file selection and display -->
<div id="file-box"></div>
<!-- Upload start button -->
<button id="btn-upload" type="button">Upload</button>
```

#### JavaScript

```javascript
const uploader = new SkyUploader('#file-box', {
  autoUpload: false, // Turn off automatic upload
  ...
});

// Add click event listener for the upload button
document.getElementById('btn-upload').addEventListener('click', function() {
  uploader.start()
    .then(_ => {
      // Handle upload completion
    })
    .catch(_ => {
      // Handle upload error
    });
});
```

## Key Configuration

Sky Uploader can be customized to fit specific upload requirements. Below are the main options you can configure:

- **url**: Specifies the endpoint where the files will be uploaded.
- **name**: The name attribute for the input tag after upload completion. Default is `file`.
- **handler**: Selector for the file selection button or element.
- **autoUpload**: Automatically starts the upload process as soon as files are selected. Default is `true`.
- **accept**: Specifies the types of files that can be selected for upload.
- **maxCount**: Limits the number of files that can be uploaded. Default is `1`.
- **maxProcess**: Limits the number of files that can be uploaded simultaneously. Default is `3`.
- **maxSize**: Limits the maximum size of files that can be uploaded. Default is 20,971,520 (20MB).
- **chunkSize**: Specifies the size of each chunk for chunked uploads of large files. Default is 2,097,152 (2MB).
- **usePreview**: Determines whether to display file thumbnails. It is useful for showing file extension-specific icons or image thumbnails. Default is `false`.
- **data**: Additional data to be sent with the file upload.
- **messages**: Specifies the error messages.

## Callback Functions

Sky Uploader supports several callback functions to provide feedback and allow custom actions during the upload process:

- **onAdd**: Called when a new file is added.
- **onProgress**: Provides real-time updates on upload progress.
- **onSuccess**: Called upon successful completion of an upload.
- **onDelete**: Called when a file is removed from the queue.
- **onPause**: Called when file upload is paused by the user.
- **onCancel**: Called when file upload is canceled by the user.
- **onFail**: Called when a file upload fails.
- **onError**: Invoked during file selection and the upload process in case of an error.

## Styling

SkyUploader does not apply direct styles, allowing users to freely design by specifying CSS classes.

#### Basic Structure and CSS Classes

Here is an example of the HTML structure and CSS classes generated by SkyUploader:

```html
<div class="sky-file-container exists">
  <div class="sky-file-item item-0 ready">
    <input type="hidden" name="file[0][name]" value="">
    <input type="hidden" name="file[0][path]" value="">
    <input type="hidden" name="file[0][size]" value="">
    <div class="sky-file-preview"><!-- Thumbnail area --></div>
    <div class="sky-file-name"><!-- File name --></div>
    <div class="sky-file-size"><!-- File size --></div>
    <progress max="100" value="0">0 %</progress>
    <div class="sky-file-error">Error</div>
  </div>
  <div class="sky-file-item item-1 success">
    ...
  </div>
</div>
```

### Dynamically Assigned CSS Classes

SkyUploader dynamically assigns classes to easily identify the presence of selected files and the upload status. This allows providing feedback to users on the current state.

#### CSS Classes Based on the Presence of Selected Files

Classes `.empty` or `.exists` are automatically added to `.sky-file-container` to distinguish between the absence and presence of selected files.

```html
<!-- When no files are selected -->
<div class="sky-file-container empty"></div>

<!-- When files are selected -->
<div class="sky-file-container exists">
    <div class="sky-file-item">...</div>
</div>
```

You can use CSS to differentiate these two states visually. For example, display a message when no files are selected and hide it when files are present.

#### CSS Classes Based on Upload Progress Status

`.sky-file-item` is assigned `.ready`, `.upload`, `.success`, `.pause`, `.error` classes based on each file's upload progress status. This allows visual differentiation of the upload progress.

```html
<div class="sky-file-container exists">
  <div class="sky-file-item ready"><!-- Waiting for upload --></div>
  <div class="sky-file-item upload"><!-- Uploading --></div>
  <div class="sky-file-item success"><!-- Upload successful --></div>
  <div class="sky-file-item pause"><!-- Upload paused --></div>
  <div class="sky-file-item error"><!-- Upload failed --></div>
</div>
```

Define styles in CSS for these states to provide visual feedback to the user. For instance, specify different colors for success, pause, and error states.


## Backend Integration

The server-side implementation should be designed to handle multipart/form-data requests and support chunked uploads if necessary. The response should be in JSON format, containing information on the success or failure of the upload.

### Request

The POST values sent to the server during file upload include:

- `id`: The unique ID of the file.
- `total`: The total size of the file.
- `offset`: The starting position of the transferred file.
- `file`: The uploaded file.
- Additional data passed through the `data` option is also included.

### Response

The server's response should be in JSON format and include the following fields:

- `success`: Whether the upload was successful (`true` or `false`).
- `message`: Response message. Typically `OK` for success, or an `error message` for failure.
- `offset`: In the case of chunked transfers, this indicates the starting position for the next transfer.
- `file`: The path of the uploaded file on the server. For chunked transfers, this should only be included in the last response.

#### Example of Completed File Upload

```json
{
  "success": true,
  "message": "OK",
  "file": "data/filename.png"
}
```

#### Example of Failed File Upload

```json
{
  "success": false,
  "message": "The upload of the file is restricted."
}
```

#### Example During Chunked Transfer

```json
{
  "success": true,
  "message": "OK",
  "offset": 1024768
}
```
