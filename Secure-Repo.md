# How to Remove Sensitive Data from Git History with `git filter-repo`

When sensitive data (such as a private key) gets accidentally committed to your repository, it’s critical to remove it from your commit history. In this guide, we’ll show you how to use `git filter-repo` to rewrite your Git history to remove or replace sensitive information. We’ll cover both approaches:

1. **Replacement Rule**: Replace the sensitive text in all commits.
2. **Commit Callback**: Drop a specific commit entirely (if necessary).

**Note**:  
Once you rewrite your repository’s history, you must force-push the changes to your remote repository. Collaborators will need to re-clone or rebase their local copies.

---

## Prerequisites

- **`git filter-repo`**: A modern, fast alternative to `git filter-branch` (written in Python). Install it from the [official instructions](https://github.com/newren/git-filter-repo).
- **A fresh mirror clone**: Work on a clean, bare mirror clone of your repository.
- **Python 3**: Ensure Python 3 is installed.

---

## Scenario

Suppose you have a commit (`7d1881b22228e1c74d7f46cb81a9956cf50b5a44`) where your private key was exposed in `bot.js`. We want to remove this sensitive data from **all commits**.

---

## Step 1. Verify Your Local History is Clean

Before pushing changes back to GitHub, verify your local history no longer contains the sensitive data.  
Run this command in your mirror clone directory:

```bash
git log --all -p | grep -i "PRIVATE KEY"
```

- **If clean**: No output (or only shows placeholder text like `==>REMOVED`).
- **If sensitive data remains**: The filtering did not work as expected.

---

## Step 2. Using a Replacement Rule

### A. Create a `replacements.txt` File

Create a file named `replacements.txt` (e.g., in `D:\fin-mirror\`) with the following content:

```vbnet
regex:-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----
==>REMOVED
```

- **Line 1**: Regex matching everything between `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` (including multi-line content).
- **Line 2**: Replacement text (`==>REMOVED` as a placeholder).

**Important**:  
Ensure there is a newline between the regex and replacement text. On Windows, use forward slashes or escape backslashes in paths.

### B. Re-run `git filter-repo` with the Replacement Rule

From your mirror clone directory (e.g., `D:\fin-mirror\fin-bot-new.git`):

```bash
git filter-repo --replace-text "D:/fin-mirror/replacements.txt"
```

Or with escaped backslashes:

```bash
git filter-repo --replace-text "D:\\fin-mirror\\replacements.txt"
```

### C. Clean Up the Repository

After filtering, run:

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### D. Verify the Replacement

Check again for sensitive data:

```bash
git log --all -p | grep -i "PRIVATE KEY"
```

If output shows only `==>REMOVED`, the replacement succeeded.

---

## Step 3. Dropping a Specific Commit Using a Commit Callback

Use this if sensitive data persists or to remove an entire commit (e.g., `8d1881b22228e1c14d7f46cb81j9956cf50b5a44`).

### A. Create a Commit Callback File

Create `drop_commit.py` in your mirror clone directory:

```python
# drop_commit.py
def commit_callback(commit):
    # Convert commit.original_id (bytes) to a string for comparison.
    if commit.original_id.decode("utf-8") == "8d1881b22228e1c14d7f46cb81j9956cf50b5a44":
        commit.skip()  # Skip (remove) this commit entirely.
```

### B. Run `git filter-repo` with the Commit Callback

Add the current directory to Python’s module search path:

```bash
git filter-repo --commit-callback "import sys; sys.path.insert(0, '.'); import drop_commit; drop_commit.commit_callback(commit)"
```

This command:
- Imports `drop_commit.py`.
- Skips the commit with the specified hash.

### C. Clean Up After Callback

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### D. Verify the Changes

Check your history again:

```bash
git log --all -p | grep -i "PRIVATE KEY"
```

Ensure the specific commit no longer appears.

---

## Step 4. Force-Pushing the Cleaned History to GitHub

### Add the Remote (if not added)

```bash
git remote add origin https://github.com/sahilmandre/fin-bot-new.git
```

### Force-Push All Branches

```bash
git push --force --all origin
```

### Force-Push All Tags

```bash
git push --force --tags origin
```

**Warning**:  
Force-pushing overwrites remote history. Inform collaborators to re-clone or reset their local copies.

---

## Final Verification and Considerations

### Double-Check Locally

```bash
git log --all -p | grep -i "PRIVATE KEY"
```

Ensure sensitive data is replaced or removed.

### GitHub Caching

- GitHub’s web interface may take minutes to reflect changes.
- Forks/clones made before the rewrite still contain the sensitive commit.

### Security

**Always rotate or revoke exposed keys immediately**—even after removal.

---

## Conclusion

By following these steps, you can safely remove sensitive data from your Git history using `git filter-repo`. This protects your project and aligns with security best practices.

**Share this guide** with others who might benefit from it. Happy cleaning! 🚀

## Credits

This project was created by Sahil Mandre. For more information or to view more of Sahil's work, please visit [Sahil's Portfolio](https://portfolio-sahilmandre.vercel.app).



