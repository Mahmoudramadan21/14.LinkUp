import AuthLayout from "@/layout/AuthLayout";
import VerificationCodeForm from "@/sections/VerificationCodeForm"
import Image from "next/image";
import authSecurityIllustration from "@/../public/illustrations/auth-security-illustration.svg";

const VerifyCodePage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Verify Code">
      <div className="auth-page">
        <div className="auth-page__container">
          {/* Left Side: Form */}
          <div className="auth-page__form">
            <VerificationCodeForm />
          </div>

          {/* Right Side: Illustration */}
          <div className="auth-page__illustration">
            <Image
              src={authSecurityIllustration}
              alt="Illustration of a person verifying a code securely"
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

export default VerifyCodePage;