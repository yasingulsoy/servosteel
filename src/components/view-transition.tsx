import * as React from "react";

type Props = {
  children: React.ReactNode;
  name?: string;
  enter?: string;
  exit?: string;
  default?: string;
  share?: string;
};

/**
 * React'in ViewTransition bileşenine tek noktadan, TİPLİ erişim.
 *
 * Bileşen Next'in paketlediği React canary'de mevcut; ancak @types/react
 * henüz bildirmiyor, adı da sürümler arasında (unstable_ öneki) değişti.
 * Bu sarmalayıcı iki adı da dener; ikisi de yoksa çocukları olduğu gibi
 * basar — yani en kötü durumda site animasyonsuz ama SAĞLAM kalır.
 */
const Impl =
  ((React as unknown as Record<string, unknown>).ViewTransition as
    | React.ComponentType<Props>
    | undefined) ??
  ((React as unknown as Record<string, unknown>).unstable_ViewTransition as
    | React.ComponentType<Props>
    | undefined);

export function ViewTransition(props: Props) {
  if (!Impl) return <>{props.children}</>;
  return <Impl {...props} />;
}
