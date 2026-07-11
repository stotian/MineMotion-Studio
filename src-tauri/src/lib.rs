use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FfmpegDetectionResult {
    available: bool,
    native_runtime: bool,
    executable: String,
    version: String,
    message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FfmpegRunResult {
    success: bool,
    exit_code: Option<i32>,
    stdout: String,
    stderr: String,
}

#[tauri::command]
fn detect_ffmpeg(executable: String) -> FfmpegDetectionResult {
    let executable = normalized_executable(&executable);
    match ffmpeg_version(&executable) {
        Ok(version) => FfmpegDetectionResult {
            available: true,
            native_runtime: true,
            executable,
            message: format!("Detected {version}"),
            version,
        },
        Err(message) => FfmpegDetectionResult {
            available: false,
            native_runtime: true,
            executable,
            version: String::new(),
            message,
        },
    }
}

#[tauri::command]
fn ffmpeg_create_job(job_id: String) -> Result<String, String> {
    let directory = job_directory(&job_id)?;
    if directory.exists() {
        fs::remove_dir_all(&directory).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.to_string_lossy().into_owned())
}

#[tauri::command]
fn ffmpeg_write_file(job_id: String, filename: String, data: Vec<u8>) -> Result<(), String> {
    if !is_generated_filename(&filename) {
        return Err("FFmpeg staging filename is not allowed.".into());
    }
    let directory = job_directory(&job_id)?;
    if !directory.is_dir() {
        return Err("FFmpeg staging job does not exist.".into());
    }
    fs::write(directory.join(filename), data).map_err(|error| error.to_string())
}

#[tauri::command]
fn ffmpeg_run_job(
    job_id: String,
    executable: String,
    args: Vec<String>,
) -> Result<FfmpegRunResult, String> {
    let directory = job_directory(&job_id)?;
    if !directory.is_dir() {
        return Err("FFmpeg staging job does not exist.".into());
    }
    let executable = normalized_executable(&executable);
    ffmpeg_version(&executable)?;
    validate_ffmpeg_args(&args)?;

    let output = Command::new(&executable)
        .args(&args)
        .current_dir(&directory)
        .output()
        .map_err(|error| format!("Could not start FFmpeg: {error}"))?;

    Ok(FfmpegRunResult {
        success: output.status.success(),
        exit_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
    })
}

#[tauri::command]
fn ffmpeg_cleanup_job(job_id: String) -> Result<(), String> {
    let directory = job_directory(&job_id)?;
    if directory.exists() {
        fs::remove_dir_all(directory).map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn normalized_executable(executable: &str) -> String {
    let trimmed = executable.trim();
    if trimmed.is_empty() {
        "ffmpeg".into()
    } else {
        trimmed.into()
    }
}

fn ffmpeg_version(executable: &str) -> Result<String, String> {
    let output = Command::new(executable)
        .arg("-version")
        .output()
        .map_err(|error| format!("FFmpeg was not found: {error}"))?;
    if !output.status.success() {
        return Err("The selected executable did not return a valid FFmpeg version.".into());
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let first_line = stdout.lines().next().unwrap_or_default().trim();
    if !first_line
        .to_ascii_lowercase()
        .starts_with("ffmpeg version")
    {
        return Err("The selected executable is not FFmpeg.".into());
    }
    Ok(first_line.to_string())
}

fn staging_root() -> PathBuf {
    std::env::temp_dir().join("minemotion-render")
}

fn job_directory(job_id: &str) -> Result<PathBuf, String> {
    if job_id.is_empty()
        || job_id.len() > 128
        || !job_id.chars().all(|character| {
            character.is_ascii_alphanumeric() || character == '_' || character == '-'
        })
    {
        return Err("Invalid FFmpeg staging job identifier.".into());
    }
    Ok(staging_root().join(job_id))
}

fn is_generated_filename(filename: &str) -> bool {
    if filename == "audio.wav" {
        return true;
    }
    filename.len() == 16
        && filename.starts_with("frame_")
        && filename.ends_with(".png")
        && filename[6..12]
            .chars()
            .all(|character| character.is_ascii_digit())
}

fn validate_ffmpeg_args(args: &[String]) -> Result<(), String> {
    let mut index = 0;
    let overwrite = next_arg(args, &mut index)?;
    if overwrite != "-y" && overwrite != "-n" {
        return Err("FFmpeg overwrite mode is invalid.".into());
    }
    expect_arg(args, &mut index, "-hide_banner")?;
    expect_arg(args, &mut index, "-loglevel")?;
    expect_arg(args, &mut index, "warning")?;
    expect_arg(args, &mut index, "-stats")?;

    if args.get(index).map(String::as_str) == Some("-i")
        && args.get(index + 1).map(String::as_str) == Some("audio.wav")
    {
        expect_arg(args, &mut index, "-i")?;
        expect_arg(args, &mut index, "audio.wav")?;
        expect_arg(args, &mut index, "-vn")?;
        expect_arg(args, &mut index, "-codec:a")?;
        expect_arg(args, &mut index, "libmp3lame")?;
        expect_arg(args, &mut index, "-q:a")?;
        expect_arg(args, &mut index, "2")?;
        return validate_single_output(args, index, &["mp3"]);
    }

    expect_arg(args, &mut index, "-framerate")?;
    let fps = next_arg(args, &mut index)?
        .parse::<u16>()
        .map_err(|_| "FFmpeg frame rate is invalid.".to_string())?;
    if !(1..=240).contains(&fps) {
        return Err("FFmpeg frame rate is outside the allowed range.".into());
    }
    expect_arg(args, &mut index, "-start_number")?;
    expect_arg(args, &mut index, "1")?;
    expect_arg(args, &mut index, "-i")?;
    expect_arg(args, &mut index, "frame_%06d.png")?;

    if args.get(index).map(String::as_str) == Some("-i") {
        expect_arg(args, &mut index, "-i")?;
        expect_arg(args, &mut index, "audio.wav")?;
        expect_arg(args, &mut index, "-c:a")?;
        expect_arg(args, &mut index, "aac")?;
        expect_arg(args, &mut index, "-b:a")?;
        expect_arg(args, &mut index, "192k")?;
        expect_arg(args, &mut index, "-shortest")?;
    } else {
        expect_arg(args, &mut index, "-an")?;
    }

    expect_arg(args, &mut index, "-c:v")?;
    match next_arg(args, &mut index)?.as_str() {
        "libx264" => validate_h26x_args(args, &mut index, false)?,
        "libx265" => validate_h26x_args(args, &mut index, true)?,
        "prores_ks" => validate_prores_args(args, &mut index)?,
        _ => return Err("FFmpeg video codec is not allowed.".into()),
    }
    validate_single_output(args, index, &["mp4", "mov"])
}

fn validate_h26x_args(args: &[String], index: &mut usize, h265: bool) -> Result<(), String> {
    expect_arg(args, index, "-preset")?;
    let preset = next_arg(args, index)?;
    if !["slow", "medium", "fast"].contains(&preset.as_str()) {
        return Err("FFmpeg preset is not allowed.".into());
    }
    expect_arg(args, index, "-crf")?;
    let crf = next_arg(args, index)?
        .parse::<u8>()
        .map_err(|_| "FFmpeg CRF is invalid.".to_string())?;
    if !(10..=40).contains(&crf) {
        return Err("FFmpeg CRF is outside the allowed range.".into());
    }
    if h265 {
        expect_arg(args, index, "-tag:v")?;
        expect_arg(args, index, "hvc1")?;
    }
    expect_arg(args, index, "-pix_fmt")?;
    expect_arg(args, index, "yuv420p")?;
    expect_arg(args, index, "-movflags")?;
    expect_arg(args, index, "+faststart")
}

fn validate_prores_args(args: &[String], index: &mut usize) -> Result<(), String> {
    expect_arg(args, index, "-profile:v")?;
    let profile = next_arg(args, index)?;
    if profile != "3" && profile != "4" {
        return Err("FFmpeg ProRes profile is not allowed.".into());
    }
    expect_arg(args, index, "-pix_fmt")?;
    expect_arg(args, index, "yuv422p10le")
}

fn validate_single_output(
    args: &[String],
    index: usize,
    extensions: &[&str],
) -> Result<(), String> {
    if index + 1 != args.len() {
        return Err("FFmpeg command must contain exactly one output file.".into());
    }
    let output = Path::new(&args[index]);
    let extension = output
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    if !output.is_absolute() || !extensions.contains(&extension.to_ascii_lowercase().as_str()) {
        return Err("FFmpeg output path is invalid.".into());
    }
    let parent = output
        .parent()
        .ok_or_else(|| "FFmpeg output directory is invalid.".to_string())?;
    if !parent.is_dir() {
        return Err("FFmpeg output directory does not exist.".into());
    }
    Ok(())
}

fn next_arg(args: &[String], index: &mut usize) -> Result<String, String> {
    let value = args
        .get(*index)
        .cloned()
        .ok_or_else(|| "FFmpeg command is incomplete.".to_string())?;
    *index += 1;
    Ok(value)
}

fn expect_arg(args: &[String], index: &mut usize, expected: &str) -> Result<(), String> {
    let value = next_arg(args, index)?;
    if value != expected {
        return Err(format!("Unexpected FFmpeg argument: {value}"));
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_ffmpeg,
            ffmpeg_create_job,
            ffmpeg_write_file,
            ffmpeg_run_job,
            ffmpeg_cleanup_job
        ])
        .run(tauri::generate_context!())
        .expect("error while running MineMotion Studio");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_generated_frame_names_only() {
        assert!(is_generated_filename("frame_000001.png"));
        assert!(is_generated_filename("audio.wav"));
        assert!(!is_generated_filename("../secret.txt"));
        assert!(!is_generated_filename("frame_1.png"));
    }

    #[test]
    fn rejects_unsafe_job_identifiers() {
        assert!(job_directory("render_safe-1").is_ok());
        assert!(job_directory("../escape").is_err());
    }
}
