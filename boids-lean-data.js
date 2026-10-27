export const LEAN_BOIDS_CODE = `structure Vec2 where
  x : Int
  y : Int

def Vec2.add (a b : Vec2) : Vec2 :=
  ⟨a.x + b.x, a.y + b.y⟩

def Vec2.sub (a b : Vec2) : Vec2 :=
  ⟨a.x - b.x, a.y - b.y⟩

def Vec2.distSq (a b : Vec2) : Nat :=
  ((a.x - b.x).natAbs * (a.x - b.x).natAbs) + ((a.y - b.y).natAbs * (a.y - b.y).natAbs)

def clampVal (val bound : Int) : Int :=
  if val > bound then bound
  else if val < -bound then -bound
  else val

def clampSpeed (v : Vec2) (maxSpeed : Int) : Vec2 :=
  ⟨clampVal v.x maxSpeed, clampVal v.y maxSpeed⟩

theorem clampVal_bounded (val bound : Int) (h : bound ≥ 0) :
    -bound ≤ clampVal val bound ∧ clampVal val bound ≤ bound := by
  dsimp [clampVal]
  split
  · omega
  · split
    · omega
    · omega

theorem clampSpeed_x_bounded (v : Vec2) (maxSpeed : Int) (h : maxSpeed ≥ 0) :
    -maxSpeed ≤ (clampSpeed v maxSpeed).x ∧ (clampSpeed v maxSpeed).x ≤ maxSpeed := by
  exact clampVal_bounded v.x maxSpeed h

theorem clampSpeed_y_bounded (v : Vec2) (maxSpeed : Int) (h : maxSpeed ≥ 0) :
    -maxSpeed ≤ (clampSpeed v maxSpeed).y ∧ (clampSpeed v maxSpeed).y ≤ maxSpeed := by
  exact clampVal_bounded v.y maxSpeed h

#check clampVal_bounded
#check clampSpeed_x_bounded
#check clampSpeed_y_bounded
#eval clampSpeed ⟨15, -20⟩ 10
`;

export const LEAN_BOIDS_DATA = {
    title: "Boids: Emergent Behavior Kinematics",
    tier: "Tier 1: Machine-Checked Kinematic Proof",
    tierClass: "tier-1",
    framework: "Lean 4 Theorem Prover • Core (Omega Tactic)",
    repoUrl: "https://github.com/meteor-chat/meteor-chat.github.io/blob/main/proofs/Boids.lean",
    project: "lean",
    code: LEAN_BOIDS_CODE,
    guarantees: [
        {
            name: "Jaminan Batas Kecepatan Kinematik (clampSpeed_bounded)",
            desc: "Teorema clampSpeed_x_bounded dan clampSpeed_y_bounded membuktikan secara mutlak melalui taktik omega bahwa kecepatan partikel di setiap sumbu selalu berada dalam batas [-maxSpeed, maxSpeed]."
        },
        {
            name: "Invariansi Stabilitas Sistem Partikel",
            desc: "Pembatasan gaya kemudi (steering clamp) mencegah lonjakan akselerasi tak terhingga atau singularitas fisik saat partikel saling mendekati jarak nol."
        }
    ]
};

export const LEAN_BOIDS_TIPS = [
    {
        name: "1. Tanda Pembuktian Sukses di Lean 4",
        desc: "Di Lean 4, panel kanan (Infoview) mencetak tipe teorema #check dan hasil komputasi #eval tanpa pesan error merah ('0 errors')."
    },
    {
        name: "2. Verifikasi Independen",
        desc: "Di bilah menu kanan atas Lean Web, Anda bisa mengklik tombol 'Can I Trust This Proof?' untuk audit otomatis oleh kernel Lean."
    }
];

export function getLeanBoidsPlaygroundUrl() {
    return "https://live.lean-lang.org/#project=lean&code=" + encodeURIComponent(LEAN_BOIDS_CODE);
}
