[Read English Document](README.en.md)

# Sky Uploader

Sky Uploader는 웹 페이지에 파일 업로드 기능을 쉽게 적용할 수 있는 자바스크립트 라이브러리입니다.

Sky Uploader는 다음과 같은 파일 업로드 관련 기능을 제공합니다:

- **다중 파일 업로드**: 사용자가 동시에 여러 파일을 선택하여 업로드할 수 있습니다.
- **분할 업로드**: 대용량 파일을 작은 크기로 나누어 업로드하여 타임아웃을 방지하고 데이터 무결성을 보장합니다.
- **드래그 앤 드롭**: 직관적인 드래그 앤 드롭으로 파일 선택을 간편하게 합니다.
- **파일 타입 및 크기 제한**: 업로드할 수 있는 파일의 유형과 크기를 제한합니다.
- **업로드 진행 상태 표시**: 상세한 진행 상태를 시각적으로 표시합니다.

## 시작하기

Sky Uploader를 프로젝트에서 사용하는 것은 매우 간단합니다. 다운로드 후 웹 페이지에 직접 포함시켜 사용할 수 있습니다.

### 다운로드 및 사용

Sky Uploader 라이브러리는 GitHub에서 다운로드 할 수 있습니다.

- [Sky Uploader GitHub](https://raw.githubusercontent.com/daddyofsky/sky.uploader.js/main/sky.uploader.js)

다운로드한 파일을 웹 프로젝트의 적절한 위치에 저장한 후, HTML 파일에 스크립트 태그로 라이브러리를 포함시킵니다.

#### HTML

```html
<script type="text/javascript" src="경로/sky.uploader.js"></script>
<div id="file-box"></div>
```

#### JavaScript

라이브러리를 초기화하고 옵션을 설정합니다:

```javascript
const uploader = new SkyUploader('#file-box', {
  url: 'https://your-upload-endpoint.com/upload',
  maxCount: 5,
});
```


## 사용 예시

### 파일 선택 버튼 사용

별도의 파일 선택 버튼을 사용하는 방법입니다.

#### HTML

```html
<!-- 파일 선택 버튼 -->
<button id="btn-browse" type="button">파일 선택</button>
<!-- 선택 파일 표시 영역 -->
<div id="file-box"></div>
```

#### JavaScript

`handler` 옵션을 사용하여 파일 선택 버튼을 지정합니다. 필요한 이벤트 리스너는 자동으로 추가됩니다.

```javascript
const uploader = new SkyUploader('#file-box', {
  handler: '#btn-browse',
  ...
});
```

### 업로드 시작 버튼 사용

선택한 파일을 자동으로 업로드하지 않고 사용자가 버튼을 클릭했을 때 한꺼번에 업로드하는 방법입니다.

#### HTML

```html
<style>
  /* 대기 상태의 개별 파일별 업로드 버튼 숨기기 */
  #file-box .sky-file-item.ready .sky-btn-action { display:none; }
</style>
<!-- 파일 선택 및 표시 영역 -->
<div id="file-box"></div>
<!-- 업로드 시작 버튼 -->
<button id="btn-upload" type="button">업로드</button>
```

#### JavaScript

```javascript
const uploader = new SkyUploader('#file-box', {
  autoUpload: false, // 자동 업로드 기능 OFF
  ...
});

// 업로드 버튼 클릭 이벤트 리스너 추가
document.getElementById('btn-upload').addEventListener('click', function() {
  uploader.start()
    .then(_ => {
      // 업로드 완료시 처리
    })
    .catch(_ => {
      // 업로드 에러시 처리
    });
});
```



## 주요 설정

Sky Uploader는 업로드 프로세스를 특정 요구 사항에 맞게 설정할 수 있습니다. 다음은 구성할 수 있는 주요 옵션입니다:

- **url**: 파일이 업로드될 서버의 엔드포인트를 지정합니다.
- **name**: 파일 업로드 완료 후 폼을 서브밋할 때 사용할 input 태그의 name 속성입니다. 기본값은 `file`입니다.
- **handler**: 파일 선택 버튼 또는 요소의 selector 입니다.
- **autoUpload**: 파일을 선택하는 즉시 업로드 프로세스를 자동으로 시작합니다. 기본값은 `true`입니다.
- **accept**: 업로드할 수 있는 파일 유형을 지정합니다.
- **maxCount**: 업로드할 수 있는 파일의 최대 개수를 제한합니다. 기본값은 `1`입니다. 
- **maxProcess**: 동시에 업로드할 수 있는 파일의 최대 개수를 제한합니다. 기본값은 `3`입니다. 
- **maxSize**: 한 번에 업로드할 수 있는 파일의 최대 크기를 제한합니다. 기본값은 20,971,520 (20MB)입니다.
- **chunkSize**: 대용량 파일을 업로드할 때 각 청크의 크기를 지정합니다. 기본값은 2,097,152 (2MB)입니다.
- **usePreview**: 파일 썸네일을 표시할 지 여부입니다. 파일 확장자별 아이콘을 보여주거나 이미지 썸네일을 보여주고자 할 때 사용됩니다. 기본값은 `false`입니다.
- **data**: 파일을 업로드할 때 함께 전송될 추가 데이터입니다.
- **messages**: 에러 메시지를 지정합니다. 

## 콜백 함수

업로드 프로세스 중에 피드백을 제공하고 사용자 정의 작업을 허용하기 위해 다음과 같은 콜백 함수를 지원합니다:

- **onAdd**: 새 파일이 추가될 때 호출됩니다.
- **onProgress**: 업로드 진행 상황에 대한 실시간 업데이트를 제공합니다.
- **onSuccess**: 업로드가 성공적으로 완료될 때 호출됩니다.
- **onDelete**: 파일이 큐에서 제거될 때 호출됩니다.
- **onPause**: 파일 업로드가 사용자에 의해 중지되었을 때 호출됩니다.
- **onCancel**: 파일 업로드가 사용자에 의해 취소되었을 때 호출됩니다.
- **onFail**: 파일 업로드가 실패했을 때 호출됩니다.
- **onError**: 파일 선택 및 업로드 프로세스 중에 오류가 발생할 때 호출합니다



## 스타일링

SkyUploader는 디자인을 위해 직접적인 스타일을 적용하지 않으며, 사용자가 자유롭게 디자인을 적용할 수 있도록 CSS 클래스를 지정합니다.

### 기본 구조 및 CSS 클래스

아래는 SkyUplader에 의해서 생성되는 HTML 구조 및 CSS 클래스들의 예시입니다.

```html
<div class="sky-file-container exists">
  <div class="sky-file-item item-0 ready">
    <input type="hidden" name="file[0][name]" value="">
    <input type="hidden" name="file[0][path]" value="">
    <input type="hidden" name="file[0][size]" value="">
    <div class="sky-file-preview"><!-- 썸네일 영역 --></div>
    <div class="sky-file-name"><!-- 파일명 --></div>
    <div class="sky-file-size"><!-- 파일 크기 --></div>
    <button class="sky-btn-action" type="button"></button>
    <button class="sky-btn-delete" type="button"></button>
    <progress max="100" value="0">0 %</progress>
    <div class="sky-file-error">Error</div>
  </div>
  <div class="sky-file-item item-1 success">
    ...
  </div>
</div>
```

### 동적으로 할당되는 CSS 클래스

SkyUploader는 선택된 파일의 존재 여부와 업로드 상태를 쉽게 확인할 수 있도록 클래스를 동적으로 할당합니다. 이를 통해 사용자에게 현재 상태에 대한 피드백을 제공할 수 있습니다.

#### 선택된 파일이 있는지에 따라 할당되는 CSS 클래스

선택된 파일이 없는 경우와 있는 경우를 구분하기 위해 `.sky-file-container`에 `.empty` 또는 `.exists` 클래스가 자동으로 추가됩니다.

```html
<!-- 선택된 파일이 없는 경우 -->
<div class="sky-file-container empty"></div>

<!-- 선택된 파일이 있는 경우 -->
<div class="sky-file-container exists">
    <div class="sky-file-item">...</div>
</div>
```

CSS를 사용하여 이 두 상태에 대한 시각적 표시를 다르게 할 수 있습니다. 예를 들어, 선택된 파일이 없을 때는 안내 문구를 표시하고, 파일이 있을 때는 숨길 수 있습니다.

#### 업로드 진행 상태에 따라 할당되는 CSS 클래스

각 파일의 업로드 진행 상태에 따라 `.sky-file-item`에 `.ready`, `.upload`, `.success`, `.pause`, `.error` 클래스가 할당됩니다. 이를 통해 업로드 진행 상황을 시각적으로 구분할 수 있습니다.

```html
<div class="sky-file-container exists">
  <div class="sky-file-item ready"><!-- 업로드 대기 중 --></div>
  <div class="sky-file-item upload"><!-- 업로드 중 --></div>
  <div class="sky-file-item success"><!-- 업로드 성공 --></div>
  <div class="sky-file-item pause"><!-- 업로드 일시 중지 --></div>
  <div class="sky-file-item error"><!-- 업로드 실패 --></div>
</div>
```

각 상태에 맞는 스타일을 CSS로 정의하여 사용자에게 시각적 피드백을 제공할 수 있습니다. 예를 들어, 성공, 일시 중지, 에러 상태에 대해 각각 다른 색상을 지정할 수 있습니다.


## 백엔드 통합

서버 측 구현은 multipart/form-data 요청을 처리하고 필요한 경우 분할 업로드를 지원하도록 설계되어야 합니다. 응답은 JSON 형식이어야 하며, 업로드의 성공 또는 실패를 나타내는 정보를 포함해야 합니다.

### Request

파일 업로드 시 서버로 전송되는 POST 값들은 다음과 같습니다:

- `id`: 파일의 고유 ID입니다.
- `total`: 파일 전체 크기입니다.
- `offset`: 전송된 파일의 시작 위치입니다.
- `file`: 업로드된 파일입니다.
- 그 외에 `data` 옵션을 통해 전달된 데이터가 포함됩니다.

### Response

서버의 응답은 JSON 형태로 제공되어야 하며, 다음 필드를 포함해야 합니다:

- `success`: 전송 성공 여부(`true` 또는 `false`).
- `message`: 응답 메시지. 성공 시 일반적으로 `OK`, 실패 시 `에러 메시지`입니다.
- `offset`: 분할 전송 시 다음 전송의 시작 위치를 나타냅니다.
- `file`: 서버에 업로드된 파일의 경로입니다. 분할 전송 시에는 마지막 응답에만 포함되어야 합니다.

#### 파일 업로드 완료 예시

```json
{
  "success": true,
  "message": "OK",
  "file": "data/filename.png"
}
```

#### 파일 업로드 실패 예시

```json
{
  "success": false,
  "message": "업로드가 제한된 파일입니다."
}
```

#### 분할 전송 진행 중 예시

```json
{
  "success": true,
  "message": "OK",
  "offset": 1024768
}
```
