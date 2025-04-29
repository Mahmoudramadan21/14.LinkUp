import AuthLayout from "@/layout/AuthLayout";
import LoginForm from "@/sections/LoginForm";
import Image from "next/image";
import loginIllustration from "@/../public/illustrations/login-illustration.svg"

const LoginPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Sign In">
      <div className="auth-page">
        <div className="auth-page__container">
          {/* Left Side: Form */}
          <div className="auth-page__form">
            <LoginForm />
          </div>

          {/* Right Side: Illustration */}
          <div className="auth-page__illustration">
            <Image
              src={loginIllustration}
              alt="People connecting on LinkUp"
              width={500}
              height={500}
              priority
              className="auth-page__illustration-image"
            />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;