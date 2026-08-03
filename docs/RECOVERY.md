# Recovery

On startup MineMotion shows recovery when a valid primary or backup autosave exists. Restore loads the document as dirty so it must be saved explicitly. Discard deletes only the autosave pair. Corrupt records are isolated and reported. A bounded recovery history stores at most five snapshots and silently skips projects exceeding the snapshot safety limit.

For manual recovery, keep the original `.minemotion` file unchanged, duplicate it, then open the duplicate. ZIP integrity or project migration errors should be exported through the local support-bundle command before clearing recovery data.
