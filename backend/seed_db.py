"""
Script to seed the development database (backend/route53.db) with 20 realistic Hosted Zones
and associated DNS Records for local testing.
"""

import sys
import os

# Ensure backend root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, HostedZone, DNSRecord
from app.services.auth_service import init_dev_user

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Ensure default development user exists
        init_dev_user(db)
        user = db.query(User).filter(User.email == "admin@example.com").first()
        if not user:
            print("Failed to find or create development user admin@example.com")
            sys.exit(1)

        print(f"Seeding data for User: {user.email} (ID: {user.id})")

        sample_zones = [
            ("example-app-prod.com", "Public", "Production application domain"),
            ("example-app-staging.com", "Public", "Staging environment domain"),
            ("internal-vpc-mesh.internal", "Private", "Internal VPC microservices mesh"),
            ("api-gateway-cluster.net", "Public", "Global API gateway endpoint"),
            ("cloud-infrastructure.org", "Public", "Core infrastructure management"),
            ("customer-portal-v2.com", "Public", "Customer dashboard portal"),
            ("analytics-platform.net", "Public", "Real-time analytics pipeline"),
            ("auth-identity-service.internal", "Private", "Identity & SSO service"),
            ("database-cluster-primary.internal", "Private", "PostgreSQL database primary nodes"),
            ("cdn-distribution.global", "Public", "Static content distribution edge"),
            ("mail-server-cluster.org", "Public", "Corporate email delivery cluster"),
            ("monitoring-metrics.net", "Public", "Prometheus & Grafana monitoring"),
            ("billing-payment-api.com", "Public", "Stripe payment gateway integration"),
            ("iot-telemetry-hub.io", "Public", "IoT device telemetry hub"),
            ("mobile-api-v2.net", "Public", "iOS & Android mobile API backend"),
            ("disaster-recovery.org", "Public", "Failover DR backup site"),
            ("kubernetes-control-plane.internal", "Private", "K8s cluster control plane"),
            ("logging-elasticsearch.internal", "Private", "ELK log aggregation cluster"),
            ("developer-sandbox-env.io", "Public", "Internal developer sandbox domain"),
            ("security-audit-compliance.org", "Public", "Security audit logs & compliance"),
        ]

        created_zones_count = 0
        created_records_count = 0

        for name, zone_type, desc in sample_zones:
            existing_zone = (
                db.query(HostedZone)
                .filter(HostedZone.name == name, HostedZone.user_id == user.id)
                .first()
            )
            if not existing_zone:
                is_private = (zone_type == "Private")
                zone = HostedZone(
                    name=name,
                    zone_type=zone_type,
                    description=desc,
                    private_zone=is_private,
                    user_id=user.id,
                )
                db.add(zone)
                db.flush() # Populate zone.id
                created_zones_count += 1
            else:
                zone = existing_zone

            # Add 5 DNS records for each zone if zone has no records
            if db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count() == 0:
                records_to_create = [
                    DNSRecord(hosted_zone_id=zone.id, name="www", type="A", ttl=300, value="192.168.1.10"),
                    DNSRecord(hosted_zone_id=zone.id, name="v6", type="AAAA", ttl=300, value="2001:db8::1"),
                    DNSRecord(hosted_zone_id=zone.id, name="api", type="CNAME", ttl=600, value=f"gateway.{name}"),
                    DNSRecord(hosted_zone_id=zone.id, name="@", type="TXT", ttl=300, value=f"v=spf1 include:_spf.{name} ~all"),
                    DNSRecord(hosted_zone_id=zone.id, name="@", type="MX", ttl=300, value=f"10 mail.{name}"),
                ]
                for rec in records_to_create:
                    db.add(rec)
                    created_records_count += 1

        db.commit()
        print(f"\nSUCCESS: Successfully seeded database!")
        print(f"- Hosted Zones created: {created_zones_count} (Total in DB: {db.query(HostedZone).count()})")
        print(f"- DNS Records created: {created_records_count} (Total in DB: {db.query(DNSRecord).count()})")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
