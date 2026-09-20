# Varanasi Connect — editable interactive website

This version keeps the original Varanasi Connect visual identity and adds clickable, editable community sections.

## 1. Why GitHub sometimes seems not to take folders

Git does not store empty folders by themselves. A folder only appears in a GitHub repository when it contains at least one file.

This package already contains a small `README.txt` inside every content folder so GitHub will keep the folders.

The important folders are:

- `assets/community/movie-nights/`
- `assets/community/photography-competition/`
- `assets/community/meetups-projects/`
- `assets/varanasi/ganga/`
- `assets/varanasi/streets/`
- `assets/varanasi/people/`
- `assets/varanasi/culture/`
- `assets/varanasi/community/`

## 2. How to add photos later

Open the appropriate folder in GitHub and choose **Add file → Upload files**.

For example, for Movie Nights:

`assets/community/movie-nights/`

Upload your JPG, PNG, WEBP or GIF files there and commit the changes.

You do **not** need to edit the HTML for the photos. The website reads the public GitHub folder automatically and displays the images in the corresponding clickable panel.

## 3. Important: the repository must be public

The automatic image discovery uses the public GitHub Contents API. If the repository is private, a normal GitHub Pages website cannot safely access it without authentication.

## 4. If you use GitHub Pages

If the website is hosted as:

`https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`

the site can normally detect the repository automatically.

If you use a custom domain, open `site-config.js` and replace:

- `YOUR_GITHUB_USERNAME`
- `YOUR_REPOSITORY_NAME`

with your real GitHub username and repository name.

## 5. Editing event information without changing the design

Open `content.json`.

This file contains the text for:

- Movie Nights
- Photography Competition
- Photography rules
- Meetups & New Projects
- Meetup plans, dates and locations
- Varanasi album names and descriptions

You can change the words while keeping the same structure.

## 6. Photography Competition submissions

A static GitHub Pages site cannot securely receive file uploads by itself. The included button is prepared to use an external form.

For the final setup, create a Google Form (or another file-upload form) and put its URL into `site-config.js` as:

`photographySubmissionUrl: "YOUR_FORM_URL"`

Until you do that, the button provides an email fallback.

## 7. Replacing the old website

Upload the contents of this folder to the root of your GitHub repository, replacing the old `index.html` and adding the new files/folders.

Keep the existing `assets/logo.png` and `assets/logos/` files.

The main entry point remains:

`index.html`

No build system, npm, React or other programming setup is required. It is a normal static website suitable for GitHub Pages.
