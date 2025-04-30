import AuthLayout from "@/layout/AuthLayout";
import ForgotPasswordForm from "@/sections/ForgotPasswordForm";
import Image from "next/image";
import authSecurityIllustration from "@/../public/illustrations/auth-security-illustration.svg";

const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Forgot Password">
      <div className="auth-page">
        <div className="auth-page__container">
          {/* Left Side: Form */}
          <div className="auth-page__form">
            <ForgotPasswordForm />
          </div>

          {/* Right Side: Illustration */}
          <div className="auth-page__illustration">
            <Image
              src={authSecurityIllustration}
              alt="Illustration of a person resetting their password securely"
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

export default ForgotPasswordPage;