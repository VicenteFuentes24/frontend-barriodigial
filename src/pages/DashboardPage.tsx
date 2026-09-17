import { ArrowRight, ClipboardPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hasAnyRole } from '../auth/authUtils';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import RoleBadge from '../components/ui/RoleBadge';
import { useAuthProfile } from '../hooks/useAuthProfile';
import type { AppRole } from '../types/auth';

interface DashboardCard {
  title: string;
  value: string;
  description: string;
}

function getCardsByRole(role: AppRole): DashboardCard[] {
  if (role === 'Admin') {
    return [
      {
        title: 'Trámites activos',
        value: '---',
        description: 'Disponible cuando exista el endpoint de KPIs.',
      },
      {
        title: 'Trámites resueltos',
        value: '---',
        description: 'Sin información disponible.',
      },
      {
        title: 'Tiempo promedio',
        value: '---',
        description: 'Esperando datos de reportería.',
      },
      {
        title: 'Trámites recientes',
        value: '---',
        description: 'Se mostrarán desde el backend.',
      },
    ];
  }

  if (role === 'Operador') {
    return [
      {
        title: 'Solicitudes pendientes',
        value: '---',
        description: 'Sin información disponible.',
      },
      {
        title: 'Trámites en gestión',
        value: '---',
        description: 'Esperando respuesta del servicio.',
      },
      {
        title: 'Trámites en terreno',
        value: '---',
        description: 'Se completará con datos reales.',
      },
    ];
  }

  if (role === 'Auditor') {
    return [
      {
        title: 'Auditoría',
        value: '---',
        description: 'Consulta de trazabilidad en modo lectura.',
      },
      {
        title: 'Últimas actividades',
        value: '---',
        description: 'Disponible cuando /api/audit responda.',
      },
    ];
  }

  return [
    {
      title: 'Mis trámites',
      value: '---',
      description: 'Se listarán desde el backend.',
    },
    {
      title: 'Último estado',
      value: '---',
      description: 'Sin información disponible.',
    },
  ];
}

export default function DashboardPage() {
  const { error, isLoading, profile, refreshProfile, roles } = useAuthProfile();

  if (isLoading) {
    return <LoadingState message="Cargando perfil..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="No se pudo cargar tu perfil"
        message={error}
        onRetry={refreshProfile}
      />
    );
  }

  if (!profile || !profile.primaryRole) {
    return (
      <section className="page-stack">
        <PageHeader
          title="Dashboard"
          description="Resumen preparado según el rol autenticado en Microsoft Entra ID."
        />
        <ErrorState
          title="Perfil sin rol válido"
          message="El BFF autenticó la sesión, pero no devolvió un rol válido para BarrioDigital."
          onRetry={refreshProfile}
        />
      </section>
    );
  }

  const cards = getCardsByRole(profile.primaryRole);
  const canCreateRequest = hasAnyRole(roles, ['Cliente', 'Operador', 'Admin']);

  return (
    <section className="page-stack">
      <PageHeader
        title="Dashboard"
        description="Resumen preparado según el rol autenticado en Microsoft Entra ID."
        actions={<RoleBadge role={profile.primaryRole} />}
      />

      <div className="welcome-band">
        <div>
          <p className="eyebrow">Bienvenido/a</p>
          <h2>{profile.name}</h2>
          <span>{profile.email}</span>
        </div>
        {canCreateRequest ? (
          <Link className="button button-secondary" to="/requests">
            <ClipboardPlus size={18} aria-hidden="true" />
            Crear trámite
          </Link>
        ) : null}
      </div>

      <div className="metric-grid">
        {cards.map((card) => (
          <article className="metric-card" key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <div className="info-band">
        <div>
          <h2>Información disponible</h2>
          <p>
            Las tarjetas no muestran valores inventados. Se poblarán cuando los
            servicios del backend entreguen datos reales.
          </p>
        </div>
        <ArrowRight size={22} aria-hidden="true" />
      </div>
    </section>
  );
}

