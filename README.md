# Home Library Service

## Setup and Running

Follow these steps to set up and run the project:

### 1. Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

### 2. Downloading

```
git clone {repository URL}
```

### 3. Installing NPM modules

```
npm install
```

### 4. Setting environment variables

Create an <kbd>.env</kbd> file

### 5. Running application

```
npm start
```

## Checking the work

To check, use Postman or something similar.

At this stage, you can create users, tracks, albums, and artists, as well as read, edit, and delete information about them. You can also add and remove tracks, albums, and artists from your favorites.

**Required fields:**

Adding a user:

```
{
  login: string;
  password: string;
}
```

User update:

```
{
  oldPassword: string;
  newPassword: string;
}
```

Creating a track:

```
{
  name: string;
  duration: number;
}
```

Adding a artist:

```
{
  name: string;
  grammy: boolean;
}
```

Creating a album:

```
{
  name: string;
  year: number;
}
```

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

To run all test with authorization

```
npm run test:auth
```

To run only specific test suite with authorization

```
npm run test:auth -- <path to suite>
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging
