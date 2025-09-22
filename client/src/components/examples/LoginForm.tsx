import LoginForm from '../LoginForm';

export default function LoginFormExample() {
  return (
    <LoginForm 
      onLogin={(credentials) => console.log('Login:', credentials)}
      onSocialLogin={(provider) => console.log('Social login:', provider)}
    />
  );
}