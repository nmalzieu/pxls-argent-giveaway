import styles from "../styles/Button.module.scss";

type Props = {
  text: string;
  action?: any;
  disabled?: boolean;
  rainbow?: boolean;
  block?: boolean;
};

const Button = ({ text, action, disabled, rainbow, block }: Props) => (
  <div
    className={`${styles.button} ${rainbow ? styles.rainbowButton : ""} ${
      block ? styles.block : ""
    } ${disabled ? styles.disabled : ""}`}
    onClick={action}
  >
    {text}
  </div>
);

export default Button;
