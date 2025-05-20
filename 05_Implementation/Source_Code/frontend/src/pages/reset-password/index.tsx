import AuthLayout from "@/layout/AuthLayout";
import ResetPasswordForm from "@/forms/ResetPasswordForm";
import Image from "next/image";
import authSecurityIllustration from "@/../public/illustrations/auth-security-illustration.svg";

const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Reset Password">
      <div className="auth-page">
        <div className="auth-page__container">
          {/* Left Side: Form */}
          <div className="auth-page__form">
            <ResetPasswordForm />
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

export default ResetPasswordPage;