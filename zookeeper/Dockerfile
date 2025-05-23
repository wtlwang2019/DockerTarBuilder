FROM openjdk:8-alpine

ENV ZOOKEEPER_VERSION 3.8.4
ENV PATH $PATH:/opt/zookeeper/bin/

# the start files for zookeeper use bash
RUN apk --no-cache add \
	bash

RUN buildDeps=' \
		curl \
		tar \
	' \
	&& echo "==> Installing dependencies..." \
	&& apk --no-cache add --virtual build-deps $buildDeps \
	&& echo "==> Downloading Zookeeper..." \
	&& mkdir -p /opt \
	&& curl -sSL "https://dlcdn.apache.org/zookeeper/zookeeper-${ZOOKEEPER_VERSION}/apache-zookeeper-${ZOOKEEPER_VERSION}-bin.tar.gz" | tar -xzf - -C /opt \
	&& mv /opt/apache-zookeeper-${ZOOKEEPER_VERSION}-bin /opt/zookeeper \
	&& cp /opt/zookeeper/conf/zoo_sample.cfg /opt/zookeeper/conf/zoo.cfg \
	&& apk del build-deps

ENTRYPOINT ["zkServer.sh", "start-foreground"]
