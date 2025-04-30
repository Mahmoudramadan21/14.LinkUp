import AuthLayout from "@/layout/AuthLayout";
import SignupForm from "@/sections/SignupForm";

const SignupPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Sign Up">
      <div className="auth-page signup-page">
        <div className="auth-page__container">
          <div className="auth-page__form  signup-page__form">
            <SignupForm />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;