import { CSSProperties } from "react";

import styles from "../styles/Window.module.scss";

type Props = {
  children: React.ReactNode;
  style?: CSSProperties;
  border?: boolean;
};

const Window = ({ children, style, border }: Props) => (
  <div
    className={`${styles.window} ${border ? styles.border : ""}`}
    style={style}
  >
    {children}
  </div>
);

export default Window;
