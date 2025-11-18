# Vercel Deployment Instructions

Deploying your SoulState documentation site to Vercel is a straightforward process. Here are the steps:

## 1. Push to a Git Repository

First, ensure your project is pushed to a GitHub, GitLab, or Bitbucket repository.

## 2. Import Project to Vercel

1.  Log in to your Vercel account.
2.  From your dashboard, click the **"Add New..."** button and select **"Project"**.
3.  Connect to your Git provider and select the repository you just pushed.

## 3. Configure the Project

Vercel is excellent at automatically detecting Next.js projects. The configuration should be minimal.

-   **Framework Preset**: Should be automatically detected as **Next.js**.
-   **Root Directory**: Vercel will ask for the root directory of your Next.js application. Since your documentation site is inside the `docs` folder, you must specify this.
    -   Set the Root Directory to `docs`.
    -   Click "Continue".

    ![Vercel Root Directory Setting](https://i.imgur.com/your-image-url.png) <!-- Placeholder for an actual image if possible -->

-   **Build & Output Settings**: These should be automatically configured by the Next.js preset. You do not need to change them.
    -   **Build Command**: `next build`
    -   **Output Directory**: `.next` (within the `docs` root)

-   **Environment Variables**: No environment variables are required for the documentation site to build.

## 4. Deploy

Click the **"Deploy"** button. Vercel will now pull your code, install dependencies from `docs/package.json`, run the build command, and deploy the output.

## 5. Build Output Explained

The `next.config.mjs` file is configured with `output: 'standalone'`. This tells Next.js to create a `standalone` folder inside `docs/.next/`. This folder contains a minimal server and only the necessary files (`.next/static`, `.next/server`, `node_modules`) required to run the application in production.

Vercel's build pipeline is fully compatible with this output mode and uses it to create highly optimized deployments. You don't need to do anything special; this is just for your information.

Your documentation site is now live!
