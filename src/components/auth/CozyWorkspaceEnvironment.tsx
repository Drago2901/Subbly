import React from "react";

interface CozyWorkspaceProps {
  isLit: boolean;
  isSuccess?: boolean;
}

export const CozyWorkspaceEnvironment: React.FC<CozyWorkspaceProps> = ({ isLit, isSuccess }) => {
  return (
    <div
      className={`workspace-stage ${isLit ? "stage-illuminated" : "stage-dark"} ${
        isSuccess ? "stage-celebrating" : ""
      }`}
      aria-hidden="true"
    >
      {/* 3D Scene Layer 1: Dark Room (Base State) */}
      <img
        src="/images/auth/room-dark.jpg"
        alt="Subbly Dark Cozy Room Silhouette"
        className="workspace-backdrop-img backdrop-dark"
      />

      {/* 3D Scene Layer 2: Lit Room (Cross-fades in when lamp is activated) */}
      <img
        src="/images/auth/room-lit.jpg"
        alt="Subbly Illuminated Creative Workspace with Mascot"
        className={`workspace-backdrop-img backdrop-lit ${isLit && !isSuccess ? "visible" : ""}`}
      />

      {/* 3D Scene Layer 3: Happy Ghost Mascot Celebrating (Login Success Transition) */}
      <img
        src="/images/auth/ghost-happy.jpg"
        alt="Subbly Ghost Mascot Happy Celebration"
        className={`workspace-backdrop-img backdrop-happy ${isSuccess ? "visible" : ""}`}
      />

      {/* Volumetric Warm Amber Ambient Light Overlay */}
      <div className={`workspace-light-cone-overlay ${isLit ? "active" : ""}`} />

      {/* Floating Warm Ambient Dust Particles inside the Light Cone */}
      {isLit && (
        <div className="workspace-particles-container" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="workspace-particle"
              style={{
                left: `${32 + ((i * 17) % 36)}%`,
                top: `${20 + ((i * 23) % 52)}%`,
                animationDelay: `${(i * 0.3) % 4}s`,
                animationDuration: `${3.2 + ((i * 0.5) % 3)}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
