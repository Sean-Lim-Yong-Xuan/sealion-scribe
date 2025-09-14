# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/caf0ba19-6606-450f-ae3e-1d5d385ffaf1

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/caf0ba19-6606-450f-ae3e-1d5d385ffaf1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/caf0ba19-6606-450f-ae3e-1d5d385ffaf1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## Document Upload & Parsing Feature

Supported (client-side): PDF, DOCX, TXT. Implemented in `src/lib/parseDocument.ts` using `pdfjs-dist` and `mammoth` with a reusable UI component `src/components/DocumentUpload.tsx`.

Workflow:
1. Upload in Assignment page modal or inside Essay Checker.
2. Text extracted and (if large) truncated to 50,000 chars.
3. Passed to Essay Checker via sessionStorage handoff.

Future ideas: OCR for images, server-side parsing, annotations, plagiarism scan.

## Internationalization (i18n)

Implemented via lightweight context provider `src/lib/i18n.tsx`.

Languages:
- English (en)
- Bahasa Melayu (ms)
- Tamil (ta)
- 中文 (zh)
- ภาษาไทย (th)
- Bahasa Indonesia (id)

Select language on the Language Selection page (persists in `localStorage`). Use the `useI18n` hook:

```tsx
import { useI18n } from '@/lib/i18n';
const { t } = useI18n();
return <h1>{t('dashboard.title')}</h1>;
```

Add a key: extend all dictionaries in `i18n.tsx`, then call `t('your.key')`.
