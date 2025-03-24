# LinkUp - Social Media Web Application

LinkUp is a modern social media web application that allows users to connect, share content, and interact with each other. The application includes features like user authentication, posting content (text, images, and videos), stories, direct messaging, notifications, and personalized profiles. Built using Next.js and PostgreSQL, LinkUp aims to provide a seamless and engaging user experience.

## Features

- **User Authentication:** Sign up, log in, and manage your account securely.
- **Content Sharing:** Create and share posts (text, images, or videos) and stories.
- **Social Interaction:** Like, comment, share, and report posts.
- **Notifications:** Real-time notifications for new followers, likes, comments, and messages.
- **Direct Messaging:** Chat with other users in real-time.
- **Personalized Profiles:** Customize your profile with a profile picture, bio, and highlighted stories.
- **Admin Panel:** Manage users and review reported content.
- **Search Functionality:** Search for users and content.
- **Responsive Design:** Works seamlessly across all devices.

## Technology Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Real-Time Communication:** Socket.io
- **Deployment:** Vercel
- **Version Control:** GitHub

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Mahmoudramadan21/14.LinkUp.git
   cd 14.LinkUp/05_Implementation/Source_Code
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
     JWT_SECRET="your_jwt_secret"
     EMAIL_USER="your_email@gmail.com"
     EMAIL_PASS="your_email_password_or_app_password"
     ```

4. **Run database migrations:**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

6. **Open your browser and visit:**
   ```bash
   http://localhost:3000
   ```

## Running Tests

To run the test suite, use the following command:

```bash
npm test
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or suggestions, feel free to reach out:

- **Email:** mahmoud.fci25@gmail.com
- **GitHub:** [Mahmoudramadan21](https://github.com/Mahmoudramadan21)
