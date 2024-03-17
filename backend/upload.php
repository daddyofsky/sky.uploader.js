<?php

require_once __DIR__ . '/SkyUploader.php';

$root = __DIR__;
$sub  = 'data';

try {
	if (empty($_FILES['file'])) {
		throw new RuntimeException('NO FILE');		
	}
	
	$uploader = new SkyUploader($_FILES['file'] + $_POST, $root, $sub);
	$result = $uploader->setEncodeType(SkyUploader::ENC_NAME_NONE)->upload();

	success($result);
} catch (RuntimeException $e) {
	error($e->getMessage());
}

function error($msg = ''): void
{
	try {
		echo json_encode([
			'success' => false,
			'message' => $msg ?: 'ERROR',
		], JSON_THROW_ON_ERROR);
	} catch (JsonException $e) {
		echo sprintf('{success:false,message:"%s"}', $e->getMessage());
	}
}

function success(array $data = []): void
{
	try {
		echo json_encode($data + [
				'success' => true,
				'message' => 'OK',
			], JSON_THROW_ON_ERROR);
	} catch (JsonException $e) {
		echo sprintf('{success:false,message:"%s"}', $e->getMessage());
	}
}
