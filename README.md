# Exploidus Systems (exploidus.com)

Official portal and enterprise architecture for **Exploidus Systems**.

Live at: **https://exploidus.com** (Mirrored at: https://exploidus.github.io)

---

## High-Integrity Systems & Cyber Defense Architecture

Exploidus engineers deterministic, zero-allocation state estimation, line-rate eBPF cyber defense, and bio-mimetic distributed systems from first principles in Rust.

### Division I: Aerospace Guidance & Kernel Systems
1. **[aegis-filter](https://github.com/Exploidus/aegis-filter)**: 4.07 ns `#![no_std]` zero-allocation Kalman & UKF state estimation engine with Joseph covariance stabilization for aerospace GNC and low-latency systems. Published on [Crates.io](https://crates.io/crates/aegis-filter).
2. **[scx_intent](https://github.com/sched-ext/scx/pull/3845)**: Upstream Linux kernel sched-ext pure in-kernel eBPF CPU scheduler with 5 dedicated DSQs and multi-tier starvation protection (sched-ext PR #3845).

### Division II: Cyber Defense & Bio-Distributed Fabric
3. **[xdp-guard](https://github.com/rahadbhuiya/xdp-guard)**: 100 Gbps line-rate NIC driver eBPF/XDP DDoS mitigation engine and per-IP rate limiter (Zenodo DOI: [10.5281/zenodo.23120995](https://doi.org/10.5281/zenodo.23120995)).
4. **[HuddleCluster](https://github.com/rahadbhuiya/HuddleCluster)**: Bio-mimetic thermodynamic distributed load balancer with self-healing topology. Published on [PyPI (huddle-cluster)](https://pypi.org/project/huddle-cluster/) with peer-reviewed DOIs (Zenodo: [10.5281/zenodo.20348019](https://doi.org/10.5281/zenodo.20348019), figshare: [10.6084/m9.figshare.32397180](https://doi.org/10.6084/m9.figshare.32397180)).
5. **[cnsl](https://github.com/rahadbhuiya/cnsl)**: Cross-vector security log intelligence and predictive trajectory SIEM with Kafka streaming and automated iptables quarantine. Published on [PyPI (cnsl)](https://pypi.org/project/cnsl/).

---

## Author & Governance

Architected and maintained by **Rahad Bhuiya** ([@rahadbhuiya](https://github.com/rahadbhuiya)).  
All core modules are published under permissive open-source licenses (MIT / Apache-2.0).  
Enterprise pilots and bespoke defense GNC contracts: `rahadbhuiya2021@gmail.com`.
