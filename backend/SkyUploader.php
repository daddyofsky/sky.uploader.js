<?php

class SkyUploader
{
	public const ENC_NAME_NONE   = 0;
	public const ENC_NAME_UID    = 1;
	public const ENC_NAME_BASE64 = 2;
	public const ENC_NAME_MD5    = 3;

	protected const PART_SUFFIX = '.part';

	protected string $root;
	protected string $sub;
	protected string $dir;
	protected int $encType = self::ENC_NAME_UID;

	protected string $id;
	protected int    $total;
	protected int    $offset;
	protected int    $size;
	protected string $name;
	protected string $tmp_file;

	protected array $extDeny = ['var', 'php', 'jsp', 'asp', 'exe', 'com'];

	public function __construct(array $data, string $root, string $sub = '')
	{
		$this->root = $root;
		$this->sub  = trim(trim($sub), '/\\');
		$this->dir  = $this->sub ? $this->root . '/' . $this->sub : $this->root;

		$this->setData($data);
	}

	public function setData(array $data): void
	{
		$this->id = $data['id'];
		$this->total = (int)$data['total'];
		$this->offset = (int)$data['offset'];
		$this->size = (int)$data['size'];
		$this->name = $data['name'];
		$this->tmp_file = $data['tmp_name'];
	}

	public function setEncodeType(int $type): self
	{
		$this->encType = $type;

		return $this;
	}

	public function upload(): array
	{
		if ($this->isPart()) {
			return $this->uploadPart();
		}

		return $this->uploadNormal();
	}

	protected function isPart(): bool
	{
		return $this->offset > 0 || $this->total > $this->size;
	}

	protected function uploadNormal(): array
	{
		$target = $this->getTarget();
		if (move_uploaded_file($this->tmp_file, $target)) {
			return [
				'file' => $target,
			];
		}

		$this->error('UPLOAD FAIL');
	}

	protected function uploadPart(): array
	{
		$target = $this->getTargetPart();

		if ($this->offset <= 0) {
			if (file_exists($target)) {
				if ($this->total === filesize($target)) {
					return $this->uploadEndPart($target);
				}

				return $this->nextPart($target);
			}
		} else {
			if (!file_exists($target)) {
				$this->error('NO FILE PART');
			}
			if ($this->offset !== filesize($target)) {
				$this->error('OFFSET INVALID');
			}
		}

		if (!$written = $this->appendPart($target, $this->tmp_file)) {
			$this->error('FILE WRITE ERROR');
		}

		$result = $this->offset + $written;
		if ($result > $this->total) {
			$this->error('TOO BIG');
		}
		if ($result < $this->total) {
			return $this->nextPart($target);
		}

		return $this->uploadEndPart($target);
	}

	protected function uploadEndPart($target): array
	{
		$file = $this->getTarget();
		if (!rename($target, $file)) {
			$this->error('FILE MOVE ERROR');
		}

		return [
			'file' => $this->getRelativePath($file),
		];
	}

	protected function appendPart($target, $tmp_file): int
	{
		return (int)file_put_contents($target, file_get_contents($tmp_file), FILE_APPEND);
	}

	protected function nextPart($target): array
	{
		clearstatcache(false, $target);
		$offset = filesize($target);

		return [
			'offset' => $offset,
		];
	}

	protected function checkTargetPart($target): void
	{
		if ($this->offset <= 0) {
			if (file_exists($target)) {
				$this->nextPart($target);
			}
		} else {
			if (!file_exists($target)) {
				$this->error('NO FILE PART');
			}
			if ($this->offset !== filesize($target)) {
				$this->error('OFFSET INVALID');
			}
		}
	}

	public function getTarget($overwrite = false): string
	{
		// ex) foobar.php.var --> foobar.php
		$name = preg_replace('/\.var$/', '', $this->name);
		$ext = $this->getExt($name);

		if (in_array(strtolower($ext), $this->extDeny, true)) {
			$this->error('DENY EXT');
		}

		$target = $this->encodeName($name, $this->encType);

		if (!$overwrite) {
			$i = 0;
			$basename = basename($target, $ext);
			while (file_exists($this->dir . '/' . $target)) {
				$i++;
				$target = $basename . '_' . $i . $ext;
			}
		}

		return $this->dir . '/' . $target . $ext;
	}

	protected function getRelativePath($path)
	{
		if (strpos($path, $this->root) === 0) {
			return substr($path, strlen($this->root) + 1);
		}

		return $path;
	}

	protected function getExt(string $name): string
	{
		return '.' . strtolower(pathinfo($name, PATHINFO_EXTENSION));
	}

	protected function getTargetPart(): string
	{
		return $this->dir . '/' . $this->id . self::PART_SUFFIX;
	}

	protected function encodeName(string $name, int $type): string
	{
		if ($type === self::ENC_NAME_UID) {
			return uniqid('', true);
		}

		if ($type === self::ENC_NAME_MD5) {
			return md5($name);
		}

		if ($type === self::ENC_NAME_BASE64) {
			return base64_encode($name);
		}

		// no extension
		$name = pathinfo($name, PATHINFO_FILENAME);
		return str_replace(' ', '_', $name);
	}

	protected function error($msg): void
	{
		throw new RuntimeException($msg);
	}
}
