// AuthLayout component for authentication pages
import Head from "next/head";
import Image from "next/image";

// Define props type
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title = "LinkUp | Sign In" }) => {
  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sign in to LinkUp to connect with friends and share your moments." />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>

      {/* Main Layout with Background SVGs */}
      <div className="auth-layout">
        {/* Liquid SVG on the right */}
        <div className="auth-layout__liquid">
          <Image
            src="/svgs/liquid.svg"
            alt="Liquid background decoration"
            width={600}
            height={636}
            className="auth-layout__liquid-image"
          />
        </div>

        {/* Footer SVG at the bottom */}
        <div className="auth-layout__footer">
          <Image
            src="/svgs/footer.svg"
            alt="Footer background decoration"
            width={1439}
            height={214}
            className="auth-layout__footer-image"
          />
        </div>

        {/* Main Content */}
        <div className="auth-layout__container container">{children}</div>
      </div>
    </>
  );
};

export default AuthLayout;